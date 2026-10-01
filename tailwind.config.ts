import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        military: {
          dark: "#1B1B1B",
          green: {
            dark: "#2F3E2F",
            mid: "#3B4A3B",
            light: "#A3B18A",
          },
          gray: "#F5F5F5",
        },
      },
      borderRadius: {
        lg: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
