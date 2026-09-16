// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    rules: {
      "@stylistic/member-delimiter-style": ["error",
        {
          multiline: {
            delimiter: "semi",
            requireLast: true,
          },
          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
          multilineDetection: "brackets",
        },
      ],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/no-multi-spaces": ["error"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "vue/max-attributes-per-line": [
        "error", {
          singleline: {
            max: 3,
          },
          multiline: {
            max: 3,
          },
        },
      ],
      "vue/no-multiple-template-root": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
