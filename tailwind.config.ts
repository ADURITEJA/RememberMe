import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Remme Liquid Glass Palette
        remme: {
          sage: "#5B8C72",    // Primary Accent: Warm Sage Green
          amber: "#E8A94C",   // Secondary Accent: Soft Amber
          offWhite: "#FAF7F2", // Background (light): Warm Off-White
          charcoal: "#1E2620", // Background (dark): Deep Warm Charcoal
          ink: "#26302B",      // Text Primary (light)
          inkLight: "#F3EFE8", // Text Primary (dark)
          status: {
            completed: "#5B8C72", // Same as sage
            pending: "#E8A94C",   // Same as amber
            needsAttention: "#C96A4B", // Warm Terracotta
            emergency: "#D93A2B", // Clear Red (SOS Only)
          },
          glass: {
            light: "rgba(255, 255, 255, 0.65)", // Frosted white tint
            dark: "rgba(30, 38, 32, 0.65)",     // Frosted charcoal tint
          }
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)",
        "glass-gradient-dark": "linear-gradient(180deg, rgba(30, 38, 32, 0.7) 0%, rgba(30, 38, 32, 0.5) 100%)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
