import { connection } from "next/server";
import { checkHealth } from "@/server/health";

export async function GET() {
  await connection(); // 每次請求都要實際檢查，不在 build 時預先產生
  const health = await checkHealth();
  return Response.json(health, { status: health.status === "ok" ? 200 : 503 });
}
