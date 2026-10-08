"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface TrackingSearchFormProps {
  initialValue?: string;
}

export default function TrackingSearchForm({
  initialValue = "",
}: TrackingSearchFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <div className="clay-inset flex flex-1 items-center gap-2 rounded-xl px-4 py-3">
        <Search
          size={18}
          className="shrink-0 text-olive-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter waybill number, e.g. WB-ABC12345"
          className="w-full bg-transparent text-sm text-olive-800 outline-none placeholder:text-olive-400"
          aria-label="Waybill number"
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-olive-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-olive-700"
      >
        Track
      </button>
    </form>
  );
}
