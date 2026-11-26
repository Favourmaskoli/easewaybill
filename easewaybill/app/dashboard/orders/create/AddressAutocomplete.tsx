"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

// @mapbox/search-js-react touches `document` at module-evaluation time
// (it registers browser custom elements internally), which crashes
// Next.js's server-side render pass even inside a "use client" component
// — "use client" only marks the hydration boundary, it doesn't skip SSR.
// Loading it via next/dynamic with ssr: false defers the import entirely
// to the browser, where `document` actually exists.
const SearchBox = dynamic(
  () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
  { ssr: false },
);

// npm install @mapbox/search-js-react
// .env.local: NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

export interface ResolvedAddress {
  formattedAddress: string;
  mapboxId: string | null;
  lat: number | null;
  lng: number | null;
  /** true if the user typed free text instead of picking a suggestion */
  isManualEntry: boolean;
}

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  required?: boolean;
  value: ResolvedAddress | null;
  onChange: (address: ResolvedAddress) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function AddressAutocomplete({
  label,
  placeholder,
  required = false,
  value,
  onChange,
}: AddressAutocompleteProps) {
  const [inputText, setInputText] = useState(value?.formattedAddress ?? "");

  // The mobile and desktop forms are both mounted, so keep their text in sync.
  useEffect(() => {
    setInputText(value?.formattedAddress ?? "");
  }, [value?.formattedAddress]);

  // Fires when the user picks a suggestion from the Mapbox dropdown.
  const handleRetrieve = useCallback(
    (res: any) => {
      const feature = res?.features?.[0];
      if (!feature) return;

      const [lng, lat] = feature.geometry?.coordinates ?? [null, null];
      const formattedAddress =
        feature.properties?.full_address ??
        feature.properties?.name ??
        inputText;

      setInputText(formattedAddress);
      onChange({
        formattedAddress,
        mapboxId: feature.properties?.mapbox_id ?? null,
        lat,
        lng,
        isManualEntry: false,
      });
    },
    [inputText, onChange],
  );

  // Clear the old location as soon as the text changes. No timer, so a
  // delayed update can't overwrite a selected suggestion.
  const handleChange = useCallback(
    (text: string) => {
      setInputText(text);
      onChange({
        formattedAddress: text,
        mapboxId: null,
        lat: null,
        lng: null,
        isManualEntry: true,
      });
    },
    [onChange],
  );

  return (
    <div>
      <label
        htmlFor={`address-${label}`}
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: "#c0392b" }}> *</span>}
      </label>

      <SearchBox
        accessToken={MAPBOX_TOKEN}
        value={inputText}
        onChange={handleChange}
        onRetrieve={handleRetrieve}
        placeholder={placeholder}
        options={{
          country: "ng",
          language: "en",
        }}
      />

      {value?.isManualEntry && inputText.length > 0 && (
        <p
          role="status"
          style={{
            fontSize: 12,
            color: "#a35d00",
            marginTop: 4,
          }}
        >
          This address wasn't selected from suggestions — a delivery agent will
          need to confirm it manually.
        </p>
      )}

      {value?.lat != null && value?.lng != null && (
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Located at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
