import { defineConfig } from "eslint/config";
// @ts-expect-error - vercel are fucking clowns
import nextVitals from "eslint-config-next/core-web-vitals";
// @ts-expect-error - vercel are fucking clowns
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([...nextVitals, ...nextTs, prettier]);

export default eslintConfig;
