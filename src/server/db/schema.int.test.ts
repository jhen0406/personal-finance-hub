import { describe, expect, it } from "vitest";
import { setupTestDb } from "../../../test/integration/db";
import { users } from "./schema";

const db = setupTestDb();

describe("users 資料表", () => {
  it("可以建立使用者，id 與時間戳由資料庫產生", async () => {
    const [user] = await db
      .insert(users)
      .values({ lineUserId: "U0001", displayName: "小明" })
      .returning();

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  // AC-01-2：同一個 LINE 使用者不會被重複建立，由資料庫的唯一鍵保證
  it("同一個 line_user_id 不能建立兩次", async () => {
    await db.insert(users).values({ lineUserId: "U0001", displayName: "小明" });

    await expect(
      db.insert(users).values({ lineUserId: "U0001", displayName: "另一個名字" }),
    ).rejects.toMatchObject({ cause: { code: "23505" } }); // unique_violation
  });
});
