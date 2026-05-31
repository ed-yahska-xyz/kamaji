import type { FC } from "hono/jsx";

interface ContributionDay {
    date: string;
    contributionCount: number;
    color: string;
}

interface ContributionWeek {
    contributionDays: ContributionDay[];
}

interface ContributionsViewProps {
    weeks: ContributionWeek[];
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

function generateEmptyWeeks(): ContributionWeek[] {
    const weeks: ContributionWeek[] = [];
    const today = new Date();

    for (let w = 51; w >= 0; w--) {
        const days: ContributionDay[] = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (w * 7 + (6 - d)));
            days.push({
                date: date.toISOString().split("T")?.[0] || "",
                contributionCount: -1,
                color: "",
            });
        }
        weeks.push({ contributionDays: days });
    }
    return weeks;
}

export const ContributionsView: FC<ContributionsViewProps> = ({ weeks, title = "Contributions" }) => {
    const isEmpty = !weeks || weeks.length === 0;
    const weeksToUse = isEmpty ? generateEmptyWeeks() : weeks;

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
                {weeksToUse.map((week, wi) => (
                    <div class="contributions-week" key={wi}>
                        {week.contributionDays.map((day, di) => {
                            const empty = isEmpty || day.contributionCount < 0;
                            return (
                                <div
                                    key={`${wi}-${di}`}
                                    class={`contributions-cell${empty ? " contributions-cell-empty" : ""}`}
                                    style={empty ? undefined : `background-color: ${getColor(day.contributionCount)};`}
                                    title={empty ? day.date : `${day.contributionCount} contributions on ${day.date}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
