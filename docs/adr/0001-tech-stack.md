# ADR 0001：技術棧選擇

- 狀態：已採用
- 日期：2026-11-26

## 背景

SPEC 帶出以下限制，技術選型依此倒推：

| # | 限制 | 來源 |
|---|---|---|
| C1 | 前端必須是 web app，執行於 LINE 內建瀏覽器 | LINE MINI App |
| C2 | 需要後端：驗證 ID token、儲存資料、webhook、推播 | US-01、US-07 |
| C3 | 需要每日排程 | US-07 |
| C4 | 關聯式資料，依賴 check constraint、partial unique index、陣列欄位 | SPEC 第 6 節 |
| C5 | 日期計算是核心邏輯，必須是可測試的純函式 | SPEC 5.2–5.5、7.4 |
| C6 | 單人開發與維護，免費或接近免費 | 個人專案 |
| C7 | 與 AI 協作，錯誤要能被機器自動擋下 | 開發方式 |

## 決定

| 層級 | 選擇 |
|---|---|
| 語言 | TypeScript（strict） |
| 框架 | Next.js（App Router） |
| LINE | LINE MINI App channel（未驗證 MINI App）＋ Messaging API channel，兩者在同一個 Provider |
| 資料庫 | PostgreSQL，主機為 Neon |
| ORM | Drizzle |
| 驗證 | Zod，前後端共用 |
| 日期 | 自訂 `PlainDate` 純函式，`date-fns` 輔助 |
| UI | Tailwind CSS |
| 測試 | Vitest；整合測試連線至真實 Postgres（Docker） |
| 品質 | ESLint、Prettier、`tsc --noEmit` |
| CI | GitHub Actions |
| 部署 | Vercel（Hobby）＋ Vercel Cron |

## 理由與被否決的方案

- **TypeScript 而非 Python / Go**：C1 讓前端必須是 TS，後端也用 TS 就只需維護一份型別。型別錯誤由 `tsc` 擋下（C7）。
- **Next.js 而非 Vite SPA + Hono**：前端、API、webhook、cron endpoint 放在同一次部署（C2、C3、C6）。缺點是 App Router 概念多；MINI App 頁面大多為 Client Component。若負擔過大，Vite + Hono 是第一備案。
- **PostgreSQL 而非 MySQL / SQLite / NoSQL**：C4 的三種功能 Postgres 都原生支援。MySQL 沒有 partial index 與陣列；SQLite 沒有陣列，`ALTER TABLE` 限制多；NoSQL 無法在資料層保證關聯與欄位組合規則。
- **Neon 而非 Supabase**：Supabase 的 Auth、Storage 用不到（登入走 LINE），免費專案閒置會暫停。Neon 有資料庫分支，可配合 PR 預覽。代價是閒置後的冷啟動。
- **Drizzle 而非 Prisma**：check constraint、partial index、陣列都能定義在 TS schema 中，schema 檔即資料庫結構的唯一來源。Prisma 需在 migration 手寫 SQL 才能做到。
- **Zod**：SPEC 的欄位組合規則可直接寫成 discriminated union，前後端共用（AC-02-4）。
- **自訂 `PlainDate` 而非 `Date` / dayjs / Temporal**：帳單是日曆日期運算，`Date` 帶時區易出錯；`Temporal` 在各執行環境支援不一。自訂型別日後可替換為 `Temporal.PlainDate`。
- **整合測試用真實 Postgres 而非 mock**：部分業務規則寫在資料庫 constraint，mock 不會執行它們。
- **Vercel 而非 Cloudflare / Render / VPS**：零設定部署 Next.js，每個 PR 有 HTTPS 預覽網址，可直接在手機 LINE 中測試。Cloudflare 跑 Next.js 需 adapter；Render 等免費方案會休眠；VPS 維運成本高。

## 已知代價

- Vercel Hobby 的 cron 一天一次，觸發時間在設定的小時內浮動（最多 59 分鐘）。SPEC AC-07-1 因此定為 09:00–10:00 之間發送。
- Vercel Hobby 僅限非商業使用。商業化時需改付費方案或遷移。
- LINE MINI App channel 只能放一個 web app，所有頁面以前端路由區分。
- 業務邏輯集中在不依賴框架的 `src/domain/`，讓上述任一平台日後可替換。
