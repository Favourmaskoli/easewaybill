"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { messagesApi } from "@/lib/api/messages.api";
import type { OrderMessage } from "@/lib/types/api.types";

// ── State machine ─────────────────────────────────────────────────
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      messages: OrderMessage[];
      total: number;
      hasNextPage: boolean;
    };

type Action =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      messages: OrderMessage[];
      total: number;
      hasNextPage: boolean;
    }
  | { type: "FETCH_ERROR"; message: string }
  | { type: "APPEND"; messages: OrderMessage[] }
  | { type: "ADD_OPTIMISTIC"; message: OrderMessage }
  | { type: "REPLACE_OPTIMISTIC"; tempId: string; real: OrderMessage }
  | { type: "REMOVE_OPTIMISTIC"; tempId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { status: "loading" };

    case "FETCH_SUCCESS":
      return {
        status: "success",
        messages: action.messages,
        total: action.total,
        hasNextPage: action.hasNextPage,
      };

    case "FETCH_ERROR":
      return { status: "error", message: action.message };

    case "APPEND":
      if (state.status !== "success") return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          ...action.messages.filter(
            (m) => !state.messages.some((e) => e.id === m.id),
          ),
        ],
      };

    case "ADD_OPTIMISTIC":
      if (state.status !== "success") return state;
      return { ...state, messages: [...state.messages, action.message] };

    case "REPLACE_OPTIMISTIC":
      if (state.status !== "success") return state;
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.tempId ? action.real : m,
        ),
      };

    case "REMOVE_OPTIMISTIC":
      if (state.status !== "success") return state;
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.tempId),
      };

    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────────────
export function useMessages(
  orderId: string,
  currentUserId: string,
  currentUser: {
    firstName: string;
    lastName: string;
    role: string;
  },
) {
  const [state, dispatch] = useReducer(reducer, { status: "idle" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial fetch ────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    dispatch({ type: "FETCH_START" });
    try {
      const data = await messagesApi.list(orderId, { limit: 50 });
      dispatch({
        type: "FETCH_SUCCESS",
        messages: data.messages,
        total: data.total,
        hasNextPage: data.hasNextPage,
      });
      if (data.messages.length > 0) {
        latestMessageIdRef.current = data.messages[data.messages.length - 1].id;
      }
    } catch {
      dispatch({
        type: "FETCH_ERROR",
        message: "Failed to load messages. Please try again.",
      });
    }
  }, [orderId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // ── Poll for new messages every 10 seconds ───────────────────────
  useEffect(() => {
    if (!orderId) return;

    const poll = async () => {
      try {
        const data = await messagesApi.list(orderId, { limit: 50 });
        if (data.messages.length > 0) {
          const latest = data.messages[data.messages.length - 1];
          if (latest.id !== latestMessageIdRef.current) {
            latestMessageIdRef.current = latest.id;
            dispatch({
              type: "APPEND",
              messages: data.messages,
            });
          }
        }
      } catch {
        // Silently ignore poll errors
      }
    };

    pollRef.current = setInterval(() => {
      void poll();
    }, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  // ── Send message ─────────────────────────────────────────────────
  const send = useCallback(
    async (body: string): Promise<boolean> => {
      const trimmed = body.trim();
      if (!trimmed || sending) return false;

      setSending(true);
      setSendError(null);

      const tempId = `temp-${Date.now()}`;
      const optimistic: OrderMessage = {
        id: tempId,
        orderId,
        body: trimmed,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          role: currentUser.role,
        },
      };

      dispatch({ type: "ADD_OPTIMISTIC", message: optimistic });

      try {
        const real = await messagesApi.send(orderId, trimmed);
        dispatch({ type: "REPLACE_OPTIMISTIC", tempId, real });
        latestMessageIdRef.current = real.id;
        return true;
      } catch (err: unknown) {
        dispatch({ type: "REMOVE_OPTIMISTIC", tempId });
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to send message. Please try again.";
        setSendError(message);
        return false;
      } finally {
        setSending(false);
      }
    },
    [orderId, currentUserId, currentUser, sending],
  );

  const clearSendError = useCallback(() => setSendError(null), []);

  const messages = state.status === "success" ? state.messages : [];

  return {
    messages,
    total: state.status === "success" ? state.total : 0,
    hasNextPage: state.status === "success" ? state.hasNextPage : false,
    isLoading: state.status === "loading",
    isError: state.status === "error",
    errorMessage: state.status === "error" ? state.message : null,
    sending,
    sendError,
    send,
    refetch: fetchMessages,
    clearSendError,
  };
}
