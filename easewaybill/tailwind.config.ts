// tailwind.config.ts
// Custom Tailwind configuration for EaseWaybill
// Defines custom colors (sea blue theme) and content paths

import type { Config } from "tailwindcss";

const config: Config = {
  // Tell Tailwind which files to scan for class names
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Custom color palette for EaseWaybill
      colors: {
        brand: {
          blue: "#1A73E8",       // Primary blue (buttons, links)
          seablue: "#0EA5E9",    // Sea blue accent
          lightblue: "#E0F2FE",  // Light blue backgrounds
          darkblue: "#1E3A5F",   // Dark blue for headings/footer
          white: "#FFFFFF",
        },
      },
      // Custom font family
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;