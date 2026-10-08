"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "easewaybill_cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function choose(value: "all" | "essential") {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t p-4 shadow-lg flex flex-col md:flex-row md:items-center gap-3">
      <p className="text-sm text-gray-700 flex-1">
        We use cookies to run EaseWaybill and, with your consent, to understand
        how it&apos;s used. See our{" "}
        <Link href="/legal/cookie-policy" className="underline">
          Cookie Policy
        </Link>{" "}
        for details.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => choose("all")}
          className="px-4 py-2 rounded bg-black text-white text-sm"
        >
          Accept All
        </button>
        <button
          onClick={() => choose("essential")}
          className="px-4 py-2 rounded border text-sm"
        >
          Reject Non-Essential
        </button>
      </div>
    </div>
  );
}
