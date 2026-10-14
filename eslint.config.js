import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.flat["recommended-latest"].rules,
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["error", { max: 300 }],
      "max-lines-per-function": ["error", { max: 40 }],
      "max-depth": ["error", 3],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.config.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "No default exports for components (final invariants §2.1)",
        },
      ],
    },
  },
  prettier,
)
