/**
 * 只有年月日的日曆日期，不帶時間與時區（SPEC 5.1）。
 * 帳單週期、繳款日等計算一律使用此型別，避免 JS Date 的時區問題。
 */
export type PlainDate = {
  readonly year: number;
  readonly month: number; // 1–12
  readonly day: number; // 1–daysInMonth
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

/** 建立日期；不存在的日期（例如 2/30）會丟出 RangeError。 */
export function plainDate(year: number, month: number, day: number): PlainDate {
  const valid =
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month);
  if (!valid) throw new RangeError(`Invalid date: ${year}-${month}-${day}`);
  return { year, month, day };
}

/** 負數表示 a 較早，0 表示同一天，正數表示 a 較晚。 */
export function compare(a: PlainDate, b: PlainDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

const pad = (n: number, width: number) => String(n).padStart(width, "0");

export function toIsoString(date: PlainDate): string {
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 解析 `YYYY-MM-DD`；格式錯誤或日期不存在時丟出 RangeError。 */
export function fromIsoString(value: string): PlainDate {
  const match = ISO_DATE.exec(value);
  if (!match) throw new RangeError(`Invalid ISO date: ${JSON.stringify(value)}`);
  return plainDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * 某個時間點在指定時區是哪一天。
 * 呼叫端傳入時間點（通常是 new Date()），domain 本身不讀取系統時間。
 */
export function todayIn(timeZone: string, instant: Date): PlainDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return plainDate(get("year"), get("month"), get("day"));
}
