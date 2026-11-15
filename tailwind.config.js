// Tailwind CSS is a build-time tool only (L-01, D-58). It compiles src/input.css
// to app/css/app.css, which is committed. The app loads only that file.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import plugin from "tailwindcss/plugin";

const theme = JSON.parse(readFileSync(fileURLToPath(new URL("./src/theme.json", import.meta.url)), "utf8"));

const channels = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(" ");
const variables = (scheme) => Object.fromEntries(Object.entries(theme[scheme]).map(([name, hex]) => [`--sv-${name}`, channels(hex)]));

export default {
  content: ["./app/index.html", "./app/js/**/*.js"],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.keys(theme.light).map((name) => [name, `rgb(var(--sv-${name}) / <alpha-value>)`])),
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": { ...variables("light"), "color-scheme": "light dark" },
        "@media (prefers-color-scheme: dark)": { ":root": variables("dark") },
      });
    }),
  ],
};
