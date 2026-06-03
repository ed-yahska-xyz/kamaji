import type { FC } from "hono/jsx";
import type { DayCount } from "../src/services/diary/index.ts";

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

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export interface GridWindow {
  start: string;
  end: string;
  weeks: string[][];
}

export function buildGridWindow(now: Date = new Date()): GridWindow {
  const weeks: string[][] = [];
  for (let w = 51; w >= 0; w--) {
    const days: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      days.push(isoDate(date));
    }
    weeks.push(days);
  }
  return {
    start: weeks[0]![0]!,
    end: weeks[weeks.length - 1]![6]!,
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
        <div class="contributions-legend">
          <span class="legend-label">Less</span>
          <div class="legend-squares" aria-hidden="true">
            <div class="legend-square" style={`background-color: ${PALETTE.none};`} />
            <div class="legend-square" style={`background-color: ${PALETTE.low};`} />
            <div class="legend-square" style={`background-color: ${PALETTE.mid};`} />
            <div class="legend-square" style={`background-color: ${PALETTE.high};`} />
            <div class="legend-square" style={`background-color: ${PALETTE.peak};`} />
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>
      <div class="contributions-grid" role="img" aria-label={`${title} grid`}>
        {weeks.map((week, wi) => (
          <div class="contributions-week" key={wi}>
            {week.map((date) => {
              const count = lookup.get(date) ?? 0;
              const label =
                count === 0
                  ? `No entry on ${date}`
                  : `${count} paragraph${count === 1 ? "" : "s"} on ${date}`;
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
  );
};
