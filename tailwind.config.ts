import type { Config } from "tailwindcss";

/**
 * Sritek Design System v1.0 - Tailwind Configuration
 * 
 * This is a minimal config file for Tailwind v4.
 * Most theming is done via CSS variables in globals.css using @theme blocks.
 * This file primarily defines content paths and any JS-based extensions.
 */
const config: Config = {
  // ---------------------------------------------------------------------------
  // Content Paths
  // ---------------------------------------------------------------------------
  // Tailwind scans these paths to generate utility classes
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // ---------------------------------------------------------------------------
  // Theme Extension
  // ---------------------------------------------------------------------------
  // Extended via CSS variables in globals.css for Tailwind v4
  // This section is for any programmatic theme extensions if needed
  theme: {
    extend: {
      // Font family - Inter as primary
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },

      // Max width for content containers
      maxWidth: {
        content: "1200px",
      },

      // Minimum touch target size (WCAG compliance)
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Plugins
  // ---------------------------------------------------------------------------
  plugins: [],
};

export default config;
