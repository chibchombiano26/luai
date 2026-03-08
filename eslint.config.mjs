import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/lib/**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    ignores: ["src/lib/platform/generated-flow-pack*.ts", "src/lib/platform/generated-flow-pack*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@packs/*",
                "flow-packs/*",
                "../flow-packs/*",
                "../../flow-packs/*",
                "../../../flow-packs/*",
                "../../../../flow-packs/*",
                "../../../../../flow-packs/*",
              ],
              message:
                "Core code in src/lib must stay generic and cannot depend on flow-pack modules.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts:
    "coverage/**",
    "coverage-*/**",
    "html/**",
  ]),
]);

export default eslintConfig;
