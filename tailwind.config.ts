import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#1F2A44", soft: "#3A4663" },
        cream: { DEFAULT: "#FBF6EF", deep: "#F3EADF" },
        gold: { DEFAULT: "#C9A86A", soft: "#E8D7B0" },
        sage: { DEFAULT: "#9DAE94", soft: "#DCE4D6" },
        dusty: { DEFAULT: "#8FA6BF", soft: "#DCE5EE" },
        coral: { DEFAULT: "#D98B73", soft: "#F2D5C9", deep: "#B8664F" },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(31,42,68,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
