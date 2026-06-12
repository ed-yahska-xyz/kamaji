import type { FC } from "hono/jsx";
import type { DayCount } from "../src/services/diary/index.ts";
import {
  isoWeekNumber,
  monthIndexFromIso,
  toAppISODate,
} from "../src/services/diary/index.ts";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface DiaryGridProps {
  dayCounts: DayCount[];
  title?: string;
}

const PALETTE = {
  none: "#1A1A1A",
  low: "#5A5632",
  mid: "#B8A000",
  high: "#02f1ff",
  peak: "#EB162A",
};

function getColor(count: number): string {
  if (count <= 0) return PALETTE.none;
  if (count <= 2) return PALETTE.low;
  if (count <= 5) return PALETTE.mid;
  if (count <= 9) return PALETTE.high;
  return PALETTE.peak;
}

export interface GridWindow {
  start: string;
  end: string;
  weeks: string[][];
}

export function buildGridWindow(now: Date = new Date()): GridWindow {
  const weeks: string[][] = [];
  for (let w = 0; w <= 51; w++) {
    const days: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - (w * 7 + (6 - d)));
      days.push(toAppISODate(date));
    }
    weeks.push(days);
  }
  return {
    start: weeks[weeks.length - 1]![0]!,
    end: weeks[0]![6]!,
    weeks,
  };
}

export const DiaryGrid: FC<DiaryGridProps> = ({ dayCounts, title = "Diary" }) => {
  const lookup = new Map<string, number>();
  for (const { date, paragraphCount } of dayCounts) lookup.set(date, paragraphCount);

  const { weeks } = buildGridWindow();

  return (
    <div class="contributions">
      <div class="contributions-header">
        <span class="contributions-title">{title}</span>
      </div>
      <div class="contributions-frame" role="img" aria-label={`${title} grid`}>
        <div class="contributions-scale" aria-hidden="true">
          {weeks.map((week, wi) => {
            const first = week[0]!;
            const monthIdx = monthIndexFromIso(first);
            const prevMonth =
              wi > 0 ? monthIndexFromIso(weeks[wi - 1]![0]!) : -1;
            const nextMonth =
              wi + 1 < weeks.length
                ? monthIndexFromIso(weeks[wi + 1]![0]!)
                : -1;
            // Skip the newest column's label when the next column already
            // starts a new month — otherwise two labels sit side by side.
            const showMonth =
              monthIdx !== prevMonth && !(wi === 0 && monthIdx !== nextMonth);
            return (
              <div class="contributions-scale-cell" key={wi}>
                {showMonth && (
                  <>
                    <span class="contributions-scale-month">
                      {MONTH_ABBR[monthIdx - 1]}
                    </span>
                    <span class="contributions-scale-week">
                      w{isoWeekNumber(first)}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div class="contributions-grid">
          {weeks.map((week, wi) => (
            <div class="contributions-week" key={wi}>
              {week.map((date) => {
                const count = lookup.get(date) ?? 0;
                const label =
                  count === 0
                    ? `No entry on ${date} (week ${isoWeekNumber(date)})`
                    : `${count} paragraph${count === 1 ? "" : "s"} on ${date} (week ${isoWeekNumber(date)})`;
                return (
                  <a
                    key={date}
                    href={`/diary/${date}`}
                    class="contributions-cell"
                    style={`background-color: ${getColor(count)};`}
                    title={label}
                    aria-label={label}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
