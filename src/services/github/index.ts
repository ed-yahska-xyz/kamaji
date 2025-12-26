

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
    const response = await fetch(params.endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.CONTRIBUTIONS_PAT}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query })
    });

    return response.json();
}