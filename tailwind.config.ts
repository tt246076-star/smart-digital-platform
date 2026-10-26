import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        brand: "#2F5BFF",
        amber: "#FFB020",
        mist: "#EEF2FF",
      },
    },
  },
  plugins: [],
};
export default config;
