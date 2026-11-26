import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  // 架構分層（CLAUDE.md）：domain 只能依賴自己與 date-fns，保持純函式、可直接測試
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // 白名單：相對路徑、@/domain、date-fns、vitest（測試用）以外都禁止
              regex: "^(?!\\./|\\.\\./|@/domain/|date-fns(/.*)?$|vitest$)",
              message: "src/domain 只能 import domain 模組與 date-fns（見 CLAUDE.md 架構分層）。",
            },
            {
              // 防止用相對路徑繞出 domain，例如 ../server/db
              regex: "^\\.\\./.*\\b(server|app)\\b",
              message: "src/domain 只能 import domain 模組與 date-fns（見 CLAUDE.md 架構分層）。",
            },
          ],
        },
      ],
    },
  },

  // server 不可依賴 app 層
  {
    files: ["src/server/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**"],
              message: "依賴方向只能是 app → server → domain（見 CLAUDE.md 架構分層）。",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "drizzle/**"]),
]);

export default eslintConfig;
