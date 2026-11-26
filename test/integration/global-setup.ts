import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

/** 每次執行整合測試前，把測試資料庫重建成最新的 migration 狀態。 */
export default async function setup(project: TestProject) {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set. Copy .env.example to .env.local.");

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(
      "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE;",
    );
    await pool.query("CREATE SCHEMA public;");
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  } catch (error) {
    throw new Error(`無法準備測試資料庫（${url}）。確認已執行 npm run db:up。\n${String(error)}`);
  } finally {
    await pool.end();
  }

  project.provide("testDatabaseUrl", url);
}
