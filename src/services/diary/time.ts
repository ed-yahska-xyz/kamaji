export const APP_TZ = "America/Los_Angeles";

const isoFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toAppISODate(d: Date = new Date()): string {
  return isoFmt.format(d);
}

const longFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TZ,
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatAppDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return longFmt.format(new Date(Date.UTC(y!, m! - 1, d!, 12)));
}

export function shiftAppDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(y!, m! - 1, d!, 12));
  noonUtc.setUTCDate(noonUtc.getUTCDate() + deltaDays);
  return toAppISODate(noonUtc);
}

export function monthIndexFromIso(iso: string): number {
  return Number(iso.slice(5, 7));
}

export function isoWeekNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  // ISO 8601: shift to the Thursday of the current week
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
