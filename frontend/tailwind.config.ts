import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 *
 * カラーはglobals.cssのCSS変数を参照
 * 色を変更する場合はglobals.cssを編集してください
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 基本色 */
        background: "var(--background)",
        foreground: "var(--foreground)",

        /* プライマリ */
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },

        /* セカンダリ */
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          foreground: "var(--secondary-foreground)",
        },

        /* アクセント */
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },

        /* テキスト */
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-placeholder": "var(--text-placeholder)",

        /* 境界線 */
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
          focus: "var(--border-focus)",
        },
        divider: "var(--divider)",

        /* 入力 */
        input: {
          DEFAULT: "var(--input-background)",
          border: "var(--input-border)",
          ring: "var(--input-focus-ring)",
        },

        /* カード */
        card: {
          DEFAULT: "var(--card-background)",
          border: "var(--card-border)",
        },

        /* 状態色 */
        success: {
          DEFAULT: "var(--success)",
          bg: "var(--success-background)",
        },
        error: {
          DEFAULT: "var(--error)",
          bg: "var(--error-background)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "var(--warning-background)",
        },
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
      backgroundColor: {
        overlay: "var(--overlay)",
      },
    },
  },
  plugins: [],
};
export default config;
