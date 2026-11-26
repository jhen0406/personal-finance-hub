import { sql } from "drizzle-orm";
import { afterAll, beforeEach, inject } from "vitest";
import { createDb } from "@/server/db/client";

/**
 * 在整合測試檔案中呼叫一次：提供連到測試資料庫的 db，
 * 每個測試前清空所有資料表，檔案結束時關閉連線。
 */
export function setupTestDb() {
  const { db, pool } = createDb(inject("testDatabaseUrl"));

  beforeEach(async () => {
    const { rows } = await pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    if (rows.length === 0) return;
    const tables = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
    await db.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`));
  });

  afterAll(async () => {
    await pool.end();
  });

  return db;
}
