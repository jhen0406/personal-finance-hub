import { sql } from "drizzle-orm";
import { getDb } from "./db/client";

export type HealthStatus = { status: "ok" } | { status: "error"; reason: string };

/** 確認應用程式能連上資料庫，部署後的冒煙測試用。 */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    await getDb().execute(sql`select 1`);
    return { status: "ok" };
  } catch (error) {
    console.error("Health check failed", error);
    return { status: "error", reason: "database unreachable" };
  }
}
