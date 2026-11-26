import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];

let shared: ReturnType<typeof createDb> | undefined;

/** 應用程式共用的連線，第一次使用時才建立。 */
export function getDb(): Db {
  if (!shared) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    shared = createDb(url);
  }
  return shared.db;
}
