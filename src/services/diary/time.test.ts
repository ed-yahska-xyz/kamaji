import { describe, expect, test } from "bun:test";
import {
  APP_TZ,
  formatAppDate,
  isoWeekNumber,
  monthIndexFromIso,
  shiftAppDate,
  toAppISODate,
} from "./time";

describe("time helpers", () => {
  test("APP_TZ is America/Los_Angeles", () => {
    expect(APP_TZ).toBe("America/Los_Angeles");
  });

  test("toAppISODate buckets by Pacific calendar day", () => {
    // 2026-06-03 06:00 UTC = 2026-06-02 23:00 PDT
    const late = new Date("2026-06-03T06:00:00Z");
    expect(toAppISODate(late)).toBe("2026-06-02");

    // 2026-06-03 08:00 UTC = 2026-06-03 01:00 PDT
    const early = new Date("2026-06-03T08:00:00Z");
    expect(toAppISODate(early)).toBe("2026-06-03");
  });

  test("formatAppDate produces stable weekday regardless of runtime TZ", () => {
    // 2026-06-02 was a Tuesday in Pacific
    expect(formatAppDate("2026-06-02")).toBe("Tuesday, June 2, 2026");
  });

  test("shiftAppDate walks Pacific days", () => {
    expect(shiftAppDate("2026-06-02", -1)).toBe("2026-06-01");
    expect(shiftAppDate("2026-06-02", 7)).toBe("2026-06-09");
  });

  test("shiftAppDate handles DST 'spring forward' correctly", () => {
    // March 8, 2026 is the PDT start (skip 2am-3am local)
    expect(shiftAppDate("2026-03-07", 1)).toBe("2026-03-08");
    expect(shiftAppDate("2026-03-08", 1)).toBe("2026-03-09");
  });

  test("monthIndexFromIso parses the month component", () => {
    expect(monthIndexFromIso("2026-06-02")).toBe(6);
    expect(monthIndexFromIso("2026-01-31")).toBe(1);
    expect(monthIndexFromIso("2026-12-25")).toBe(12);
  });

  test("isoWeekNumber follows ISO 8601 rules", () => {
    expect(isoWeekNumber("2024-01-01")).toBe(1);   // Monday W1/2024
    expect(isoWeekNumber("2024-12-30")).toBe(1);   // belongs to W1/2025
    expect(isoWeekNumber("2024-12-31")).toBe(1);   // belongs to W1/2025
    expect(isoWeekNumber("2026-06-02")).toBe(23);  // Tue in W23/2026
    expect(isoWeekNumber("2020-12-31")).toBe(53);  // 53-week year
  });
});
