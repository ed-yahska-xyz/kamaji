import { readFileSync, existsSync } from "fs";

const path = "/run/secrets/contributions_pat";

const params = {
    endpoint: "https://api.github.com/graphql",
}
export async function getContributions(): Promise<any> {
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

    return response.json();
}