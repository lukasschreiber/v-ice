/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: [ "./src/**/*.{js,ts,jsx,tsx}"]
  },
  theme: {
    extend: {
      boxShadow: {
        top: "0px 0px 13px 0px #00000088"
      },
      fontSize: {
        "2xs": ".625rem",
        "3xs": ".5rem",
      },
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary-500) / <alpha-value>)",
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          200: "rgb(var(--color-primary-200) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          400: "rgb(var(--color-primary-400) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
          800: "rgb(var(--color-primary-800) / <alpha-value>)",
          900: "rgb(var(--color-primary-900) / <alpha-value>)",
          950: "rgb(var(--color-primary-950) / <alpha-value>)"
        },
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        menu: {
          bg: {
            DEFAULT: "rgb(var(--color-menu-bg-default) / <alpha-value>)",
            hover: "rgb(var(--color-menu-bg-hover) / <alpha-value>)",
            selected: "rgb(var(--color-menu-bg-selected) / <alpha-value>)",
          },
          text: {
            DEFAULT: "rgb(var(--color-menu-text-default) / <alpha-value>)",
            hover: "rgb(var(--color-menu-text-hover) / <alpha-value>)",
            selected: "rgb(var(--color-menu-text-selected) / <alpha-value>)",
          },
          border: "rgb(var(--color-menu-border) / <alpha-value>)",
        },
        toolbox: {
          bg: "rgb(var(--color-toolbox-bg) / <alpha-value>)",
          text: "rgb(var(--color-toolbox-text) / <alpha-value>)",
        },
        categories: {
          comparisons: "rgb(var(--color-categories-comparisons) / <alpha-value>)",
          test: "rgb(var(--color-categories-test) / <alpha-value>)",
          nodes: "rgb(var(--color-categories-nodes) / <alpha-value>)"
        },
        workspace: {
          connectionpoint: {
            hover: "rgb(var(--color-workspace-connectionpoint-hover) / <alpha-value>)",
          }
        }
      }
    },
  },
  plugins: [],
}

