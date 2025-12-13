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

const CELL_SIZE = 12;
const CELL_GAP = 5;

function getColor(count: number): string {
    if (count === 0) return '#1A1A1A';      // --color-dark-gray
    if (count <= 2) return '#5A5632';       // --color-olive
    if (count <= 5) return '#B8A000';       // --color-dark-yellow
    if (count <= 9) return '#02f1ff';       // --color-cyan (was yellow)
    return '#EB162A';                        // --color-red (was cyan)
}

interface MonthGroup {
    month: string;
    weeks: ContributionWeek[];
}

function getMonthName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function groupWeeksByMonth(weeks: ContributionWeek[]): MonthGroup[] {
    const groups: MonthGroup[] = [];
    let currentMonth = '';
    let currentGroup: ContributionWeek[] = [];

    weeks.forEach((week) => {
        const firstDay = week.contributionDays[0];
        if (!firstDay) return;

        const month = getMonthName(firstDay.date);
        if (month !== currentMonth) {
            if (currentGroup.length > 0) {
                groups.push({ month: currentMonth, weeks: currentGroup });
            }
            currentMonth = month;
            currentGroup = [week];
        } else {
            currentGroup.push(week);
        }
    });

    if (currentGroup.length > 0) {
        groups.push({ month: currentMonth, weeks: currentGroup });
    }

    return groups;
}

const LABEL_HEIGHT = 24;

// Generate empty grid structure for 52 weeks (1 year)
function generateEmptyWeeks(): ContributionWeek[] {
    const weeks: ContributionWeek[] = [];
    const today = new Date();

    for (let w = 51; w >= 0; w--) {
        const days: ContributionDay[] = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (w * 7 + (6 - d)));
            days.push({
                date: date.toISOString().split('T')?.[0] || "",
                contributionCount: -1, // -1 indicates empty/unpainted
                color: '',
            });
        }
        weeks.push({ contributionDays: days });
    }
    return weeks;
}

export const ContributionsView: FC<ContributionsViewProps> = ({ weeks, title = "Contributions" }) => {
    // Use empty grid if no weeks provided
    const isEmpty = !weeks || weeks.length === 0;
    const weeksToUse = isEmpty ? generateEmptyWeeks() : weeks;

    // Reverse weeks so most recent is on top
    const reversedWeeks = [...weeksToUse].reverse();
    const monthGroups = groupWeeksByMonth(reversedWeeks);

    // 2 weeks per row (14 days), with month labels between groups
    const canvasWidth = 14 * (CELL_SIZE + CELL_GAP);

    // Calculate total height: for each month, 2 rows of weeks + label
    let totalHeight = 0;
    monthGroups.forEach((group) => {
        totalHeight += LABEL_HEIGHT; // month label
        const numRows = Math.ceil(group.weeks.length / 2);
        totalHeight += numRows * (CELL_SIZE + CELL_GAP);
    });

    return (
        <div class="contributions-container resume-section">
            <div class="contributions-title">{title}</div>
            <div class="contributions-canvas-wrapper">
                <svg
                    width={canvasWidth}
                    height={totalHeight}
                    viewBox={`0 0 ${canvasWidth} ${totalHeight}`}
                >
                    {(() => {
                        let yOffset = 0;
                        return monthGroups.map((group, groupIndex) => {
                            const labelY = yOffset;
                            yOffset += LABEL_HEIGHT;
                            const weeksStartY = yOffset;
                            const numRows = Math.ceil(group.weeks.length / 2);
                            yOffset += numRows * (CELL_SIZE + CELL_GAP);

                            return (
                                <g key={groupIndex}>
                                    <text
                                        x={canvasWidth / 2}
                                        y={labelY + 16}
                                        fill="#FCE300"
                                        font-size="11"
                                        font-weight="700"
                                        text-anchor="middle"
                                        style="text-transform: uppercase; letter-spacing: 0.1em;"
                                    >
                                        {group.month}
                                    </text>
                                    {group.weeks.map((week, weekIndex) => {
                                        const rowIndex = Math.floor(weekIndex / 2);
                                        const colOffset = (weekIndex % 2) * 7;
                                        return week.contributionDays.map((day, dayIndex) => (
                                            <rect
                                                key={`${groupIndex}-${weekIndex}-${dayIndex}`}
                                                x={(colOffset + dayIndex) * (CELL_SIZE + CELL_GAP)}
                                                y={weeksStartY + rowIndex * (CELL_SIZE + CELL_GAP)}
                                                width={CELL_SIZE}
                                                height={CELL_SIZE}
                                                fill={isEmpty ? 'none' : getColor(day.contributionCount)}
                                                stroke={isEmpty ? '#333333' : 'none'}
                                                stroke-width={isEmpty ? 1 : 0}
                                            >
                                                <title>{isEmpty ? day.date : `${day.contributionCount} contributions on ${day.date}`}</title>
                                            </rect>
                                        ));
                                    })}
                                </g>
                            );
                        });
                    })()}
                </svg>
            </div>
            <div class="contributions-legend">
                <span class="legend-label">Less</span>
                <div class="legend-squares">
                    <div class="legend-square" style="background-color: #1A1A1A;" />
                    <div class="legend-square" style="background-color: #5A5632;" />
                    <div class="legend-square" style="background-color: #B8A000;" />
                    <div class="legend-square" style="background-color: #02f1ff;" />
                    <div class="legend-square" style="background-color: #EB162A;" />
                </div>
                <span class="legend-label">More</span>
            </div>
        </div>
    );
}