# Personal Finance Hub

整合 LINE 的記帳系統：在 LINE MINI App 記帳，依記帳資料估算每張信用卡的帳單，顯示在付款月曆上，並在繳款日前推播提醒。

## 文件

- **需求**：實作或修改任何功能、驗證規則、計算邏輯之前，先讀 `docs/SPEC.md` 中對應的 US 與第 5 節業務規則。SPEC 是唯一的需求來源，與 README 衝突時以 SPEC 為準。需求不明確時，停下來問我，不要自行假設。
- **技術決策**：新增依賴、更換工具、或改變架構之前，先讀 `docs/adr/`。做出新的技術決策時，新增一份編號遞增的 ADR。

## 技術棧

TypeScript（strict）、Next.js App Router、PostgreSQL（Neon）、Drizzle、Zod、Tailwind CSS、Vitest、Vercel。理由見 ADR 0001。

## 架構分層

```
src/domain/   純函式：帳單週期、繳款日、額度、驗證規則
src/server/   service 與 repository：存取資料庫、呼叫 LINE API
src/app/      Next.js 頁面與 route handler：接收請求、呼叫 service、回傳結果
```

- 依賴方向只能是 `app → server → domain`。`src/domain/` 只 import 其他 domain 模組與 `date-fns`，保持可以不接資料庫、不 mock 就直接測試。
- route handler 保持薄：解析輸入、呼叫 service、轉換回應。業務邏輯放在 `server/` 或 `domain/`。

## 領域規則

這些是最容易寫錯的地方，每一條都以 SPEC 為依據：

- **金額**：一律以整數（新台幣元）儲存與計算。
- **日期**：日曆日期一律使用 `src/domain` 的 `PlainDate`（只有年月日）。「今天」由呼叫端以 Asia/Taipei 計算後當作參數傳入；domain 函式不讀取系統時間。
- **帳單歸屬**：一筆交易算進哪張卡的帳單，只看 `credit_card_id`（SPEC 5.4）。直接刷卡與「電子支付＋信用卡扣款」都走這個欄位。
- **資料完整性**：交易的欄位組合規則（SPEC 第 6 節）同時寫在兩處：Drizzle schema 的 check constraint，以及 Zod 的 discriminated union。修改其中一處時，另一處也要一起改。
- **資料隔離**：每個查詢都以目前使用者的 `user_id` 限定範圍；存取他人資源時回傳 404。
- **封存**：信用卡、消費類別、支付工具以 `archived_at` 封存，保留歷史交易的關聯。
- **卡片資料**：只儲存卡號末四碼。

## LINE

- 前端只是一個 MINI App，所有頁面用前端路由區分。
- 身分以後端驗證過的 ID token 為準，再由後端發 httpOnly session cookie。
- 推播要符合 SPEC US-07 的合併與冪等規則：寫入 `reminder_logs`，並以唯一鍵防止重複發送。
- MINI App channel 與 Messaging API channel 位於同一個 Provider，所以兩邊的 LINE user ID 相同。

## 開發流程

1. **計畫**：會動到超過一個檔案的工作，先列出計畫，經我同意後再動手。
2. **測試先行**：`src/domain/` 的邏輯先寫測試，確認測試是 red，再實作到 green。測試案例要涵蓋 SPEC 5.6 ⚠️ 列出的邊界情況。
3. **整合測試**：涉及資料庫 constraint 或 repository 的行為，用連到本機 Docker Postgres 的整合測試驗證。
4. **完成的定義**：lint、型別檢查、單元測試、整合測試全部通過；新的行為都有對應的測試；回報時列出這次涵蓋了 SPEC 的哪些 AC。
5. **Commit**：一個 commit 只做一件事，訊息使用 Conventional Commits 格式（`feat:`、`fix:`、`test:`、`docs:`、`refactor:`、`chore:`）。

## 需要先問我的事

- 新增或升級 npm 套件
- 修改 SPEC 的需求或 AC（發現 SPEC 有矛盾或缺漏時，提出來讓我決定）
- 資料庫 schema 變更：一律用 drizzle-kit 產生新的 migration，已提交的 migration 保持不動

## 機密資訊

LINE channel secret、access token、資料庫連線字串都只放在環境變數。本機使用 `.env.local`（不進版本控制）；新增環境變數時，同步在 `.env.example` 補上變數名稱與說明，但不填值。
