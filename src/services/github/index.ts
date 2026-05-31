import { readFileSync, existsSync } from "fs";

const path = "/run/secrets/contributions_pat";

const params = {
    endpoint: "https://api.github.com/graphql",
}

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { data: any; expiresAt: number } | null = null;

export async function getContributions(): Promise<any> {
    if (cache && cache.expiresAt > Date.now()) {
        return cache.data;
    }

    const query = `
        query {
            viewer {
                login
                contributionsCollection {
                    totalCommitContributions
                    totalPullRequestContributions
                    totalIssueContributions
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                                color
                            }
                        }
                    }
                }
            }
        }
    `;
    const contributionsPat = existsSync(path) ? readFileSync(path, "utf8").trim() : process.env.CONTRIBUTIONS_PAT;
    const response = await fetch(params.endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${contributionsPat}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        console.error("Error: ", response.statusText);
    }

    const data = await response.json();
    if (response.ok) {
        cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    }
    return data;
}
