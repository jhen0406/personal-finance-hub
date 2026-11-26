import { describe, expect, it } from "vitest";
import { compare, daysInMonth, fromIsoString, plainDate, todayIn, toIsoString } from "./plain-date";

describe("plainDate", () => {
  it("建立合法的日期", () => {
    expect(plainDate(2026, 11, 26)).toEqual({ year: 2026, month: 11, day: 26 });
  });

  it.each([
    [2026, 0, 1],
    [2026, 13, 1],
    [2026, 2, 29],
    [2026, 4, 31],
    [2026, 1, 0],
    [2026, 1, 1.5],
  ])("拒絕不合法的日期 %i-%i-%i", (y, m, d) => {
    expect(() => plainDate(y, m, d)).toThrow(RangeError);
  });

  it("閏年的 2/29 是合法日期", () => {
    expect(plainDate(2028, 2, 29)).toEqual({ year: 2028, month: 2, day: 29 });
  });
});

describe("daysInMonth", () => {
  it.each([
    [2026, 1, 31],
    [2026, 2, 28],
    [2028, 2, 29], // 閏年
    [2100, 2, 28], // 可被 100 整除但不被 400 整除，不是閏年
    [2000, 2, 29], // 可被 400 整除，是閏年
    [2026, 4, 30],
    [2026, 12, 31],
  ])("%i 年 %i 月有 %i 天", (y, m, expected) => {
    expect(daysInMonth(y, m)).toBe(expected);
  });
});

describe("compare", () => {
  it("依年、月、日排序", () => {
    expect(compare(plainDate(2026, 11, 26), plainDate(2026, 11, 27))).toBeLessThan(0);
    expect(compare(plainDate(2026, 12, 1), plainDate(2026, 11, 30))).toBeGreaterThan(0);
    expect(compare(plainDate(2025, 12, 31), plainDate(2026, 1, 1))).toBeLessThan(0);
    expect(compare(plainDate(2026, 11, 26), plainDate(2026, 11, 26))).toBe(0);
  });
});

describe("ISO 字串轉換", () => {
  it("輸出補零的 YYYY-MM-DD", () => {
    expect(toIsoString(plainDate(2026, 3, 5))).toBe("2026-03-05");
  });

  it("解析 YYYY-MM-DD", () => {
    expect(fromIsoString("2026-03-05")).toEqual(plainDate(2026, 3, 5));
  });

  it.each(["2026-3-5", "2026-02-30", "2026-03-05T00:00:00Z", ""])("拒絕 %j", (s) => {
    expect(() => fromIsoString(s)).toThrow(RangeError);
  });
});

describe("todayIn", () => {
  // SPEC 5.1：日期一律以 Asia/Taipei 判斷。UTC 16:00 已經是台北隔天 00:00
  it("以指定時區決定今天的日期", () => {
    const instant = new Date("2026-11-30T16:00:00Z");
    expect(todayIn("Asia/Taipei", instant)).toEqual(plainDate(2026, 12, 1));
    expect(todayIn("UTC", instant)).toEqual(plainDate(2026, 11, 30));
  });
});
