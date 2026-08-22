import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      ".kilo/**",
      "scripts/**",
      "prisma/**",
      "data/**",
      "tmp_songs_check.txt",
      "tscheck*.txt",
      "*.log",
      "*.zip",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        module: "readonly",
        __dirname: "readonly",
        fetch: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        ReadableStream: "readonly",
        WritableStream: "readonly",
        FormData: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        crypto: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        require: "readonly",
        global: "readonly",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin.plugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["eslint.config.js", "next.config.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        process: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
  },
];
