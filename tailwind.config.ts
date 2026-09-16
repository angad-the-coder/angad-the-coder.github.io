import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brown: {
          50: "#FAF2EF",
          100: "#F0E4E0",
          200: "#D9C6BD",
          300: "#C1ABA0",
          400: "#A99387",
          500: "#957666",
          600: "#805E4E",
          700: "#684B3C",
          800: "#4F2E1E",
          900: "#381D10",
          950: "#28150B",
        },
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        brown: {
          css: {
            "--tw-prose-body": theme("colors.brown.800"),
            "--tw-prose-headings": theme("colors.brown.950"),
            "--tw-prose-links": theme("colors.brown.700"),
            "--tw-prose-bold": theme("colors.brown.950"),
            "--tw-prose-counters": theme("colors.brown.500"),
            "--tw-prose-bullets": theme("colors.brown.300"),
            "--tw-prose-hr": theme("colors.brown.200"),
            "--tw-prose-quotes": theme("colors.brown.900"),
            "--tw-prose-quote-borders": theme("colors.brown.200"),
            "--tw-prose-captions": theme("colors.brown.500"),
            "--tw-prose-code": theme("colors.brown.900"),
            "--tw-prose-pre-code": theme("colors.brown.100"),
            "--tw-prose-pre-bg": theme("colors.brown.900"),
            "--tw-prose-th-borders": theme("colors.brown.300"),
            "--tw-prose-td-borders": theme("colors.brown.200"),
            "a": {
              "fontWeight": "inherit",
              "textDecorationColor": theme("colors.brown.300"),
              "&:hover": {
                color: theme("colors.brown.900"),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
