// postcss.config.mjs
// Tailwind v4 uses its own postcss plugin
// Replace old tailwindcss + autoprefixer setup

const config = {
  plugins: {
    // ✅ New v4 postcss plugin (replaces 'tailwindcss' + 'autoprefixer')
    "@tailwindcss/postcss": {},
  },
};

export default config;