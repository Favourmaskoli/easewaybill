// "use client";

// import { useState, useCallback, useRef, useEffect } from "react";
// import { SearchBox } from "@mapbox/search-js-react";

// export interface ResolvedAddress {
//   formattedAddress: string;
//   mapboxId: string | null;
//   lat: number | null;
//   lng: number | null;
//   isManualEntry: boolean;
// }

// interface AddressAutocompleteProps {
//   label?: string;
//   placeholder: string;
//   required?: boolean;
//   hasError?: boolean;
//   value: ResolvedAddress | null;
//   onChange: (address: ResolvedAddress) => void;
// }

// interface MapboxFeature {
//   geometry?: {
//     coordinates?: number[];
//   };
//   properties?: {
//     full_address?: string;
//     name?: string;
//     mapbox_id?: string;
//   };
// }

// interface MapboxRetrieveResponse {
//   features?: MapboxFeature[];
// }

// const DEBOUNCE_MS = 300;
// const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// export default function AddressAutocomplete({
//   label = "Address",
//   placeholder,
//   required = false,
//   hasError = false,
//   value,
//   onChange,
// }: AddressAutocompleteProps) {
//   const [inputText, setInputText] = useState(value?.formattedAddress ?? "");

//   const [touchedWithoutSelection, setTouchedWithoutSelection] = useState(false);

//   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const selectionMade = useRef(false);

//   useEffect(() => {
//     setInputText(value?.formattedAddress ?? "");
//   }, [value?.formattedAddress]);

//   useEffect(() => {
//     return () => {
//       if (debounceTimer.current) {
//         clearTimeout(debounceTimer.current);
//       }
//     };
//   }, []);

//   const handleRetrieve = useCallback(
//     (response: MapboxRetrieveResponse) => {
//       const feature = response.features?.[0];

//       if (!feature) return;

//       const coordinates = feature.geometry?.coordinates;
//       const lng = coordinates?.[0];
//       const lat = coordinates?.[1];

//       const formattedAddress =
//         feature.properties?.full_address ??
//         feature.properties?.name ??
//         inputText;

//       if (!formattedAddress.trim()) return;

//       if (debounceTimer.current) {
//         clearTimeout(debounceTimer.current);
//       }

//       selectionMade.current = true;

//       const resolved: ResolvedAddress = {
//         formattedAddress,
//         mapboxId: feature.properties?.mapbox_id ?? null,
//         lat: typeof lat === "number" ? lat : null,
//         lng: typeof lng === "number" ? lng : null,
//         isManualEntry: false,
//       };

//       setInputText(formattedAddress);
//       setTouchedWithoutSelection(false);
//       onChange(resolved);
//     },
//     [inputText, onChange],
//   );

//   const handleChange = useCallback(
//     (text: string) => {
//       selectionMade.current = false;
//       setInputText(text);
//       setTouchedWithoutSelection(text.trim().length > 0);

//       if (debounceTimer.current) {
//         clearTimeout(debounceTimer.current);
//       }

//       // Clear the previous resolved location immediately.
//       // Otherwise, editing an address could retain stale coordinates.
//       onChange({
//         formattedAddress: text,
//         mapboxId: null,
//         lat: null,
//         lng: null,
//         isManualEntry: true,
//       });

//       debounceTimer.current = setTimeout(() => {
//         setTouchedWithoutSelection(text.trim().length > 0);
//       }, DEBOUNCE_MS);
//     },
//     [onChange],
//   );

//   if (!MAPBOX_TOKEN) {
//     return (
//       <div className="space-y-1">
//         <label className="block text-sm font-medium">
//           {label}
//           {required && <span className="text-red-600"> *</span>}
//         </label>
//         <input
//           type="text"
//           value={inputText}
//           onChange={(event) => handleChange(event.target.value)}
//           placeholder={placeholder}
//           required={required}
//           aria-invalid={hasError}
//           className={`clay-input w-full ${hasError ? "border-red-400" : ""}`}
//         />
//         <p className="text-xs text-amber-700">
//           Mapbox suggestions are unavailable. Enter the address manually; it
//           will need verification.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-1.5">
//       <label className="block text-sm font-medium text-olive-800">
//         {label}
//         {required && <span className="text-red-600"> *</span>}
//       </label>

//       <div
//         className={
//           hasError ? "[&_input]:!border-red-400 [&_input]:!ring-red-200" : ""
//         }
//       >
//         <SearchBox
//           accessToken={MAPBOX_TOKEN}
//           value={inputText}
//           onChange={handleChange}
//           onRetrieve={handleRetrieve}
//           placeholder={placeholder}
//           options={{
//             country: "ng",
//             language: "en",
//           }}
//         />
//       </div>

//       {hasError && (
//         <p role="alert" className="text-xs text-red-500">
//           Please enter a valid address.
//         </p>
//       )}

//       {touchedWithoutSelection && inputText.trim().length > 0 && (
//         <p role="status" className="text-xs text-amber-700">
//           Manual address: a delivery agent may need to verify this location.
//         </p>
//       )}

//       {value?.lat != null && value?.lng != null && (
//         <p className="text-xs text-olive-600">
//           Location: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
//         </p>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useCallback, useRef } from "react";
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

const DEBOUNCE_MS = 300;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function AddressAutocomplete({
  label,
  placeholder,
  required = false,
  value,
  onChange,
}: AddressAutocompleteProps) {
  const [inputText, setInputText] = useState(value?.formattedAddress ?? "");
  const [touchedWithoutSelection, setTouchedWithoutSelection] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fires when the user picks a suggestion from the Mapbox dropdown.
  const handleRetrieve = useCallback(
    (res: any) => {
      const feature = res?.features?.[0];
      if (!feature) return;

      const [lng, lat] = feature.geometry?.coordinates ?? [null, null];
      const resolved: ResolvedAddress = {
        formattedAddress:
          feature.properties?.full_address ??
          feature.properties?.name ??
          inputText,
        mapboxId: feature.properties?.mapbox_id ?? null,
        lat,
        lng,
        isManualEntry: false,
      };

      setInputText(resolved.formattedAddress);
      setTouchedWithoutSelection(false);
      onChange(resolved);
    },
    [inputText, onChange],
  );

  // Fires on every keystroke — used only to detect manual/unresolved entry.
  const handleChange = useCallback(
    (text: string) => {
      setInputText(text);
      setTouchedWithoutSelection(true);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChange({
          formattedAddress: text,
          mapboxId: null,
          lat: null,
          lng: null,
          isManualEntry: true,
        });
      }, DEBOUNCE_MS);
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

      {touchedWithoutSelection && inputText.length > 0 && (
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
