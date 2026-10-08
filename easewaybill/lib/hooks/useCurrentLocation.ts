"use client";

import { useState } from "react";

interface Coords {
  lat: number;
  lng: number;
}

export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = (): Promise<Coords> => {
    setIsLocating(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setIsLocating(false);
        const err = "Geolocation isn't supported on this device";
        setError(err);
        reject(new Error(err));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setIsLocating(false);
          console.error("Geolocation error:", err.code, err.message);
          const errorMsg =
            "Couldn't get your location — check location permissions";
          setError(errorMsg);
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: false, timeout: 10000 },
      );
    });
  };

  return { getLocation, isLocating, error };
}
