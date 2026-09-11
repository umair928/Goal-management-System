import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Claude Design handoff bundle — reference material, not app source.
    "design/**",
    // Generated Prisma client.
    "src/generated/**",
    // Plain CommonJS Node build script (runs outside the Next/TS toolchain).
    "scripts/**",
  ]),
]);

export default eslintConfig;
