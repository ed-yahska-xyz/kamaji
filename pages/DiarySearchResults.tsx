import type { FC } from "hono/jsx";
import type { TaggedParagraph } from "../src/services/diary/index.ts";
import { formatAppDate } from "../src/services/diary/index.ts";

type DiarySearchResultsPageProps = {
  tags: string[];
  results: TaggedParagraph[];
};

function groupByDate(rows: TaggedParagraph[]): Map<string, TaggedParagraph[]> {
  const out = new Map<string, TaggedParagraph[]>();
  for (const r of rows) {
    const arr = out.get(r.date) ?? [];
    arr.push(r);
    out.set(r.date, arr);
  }
  return out;
}

export const DiarySearchResultsPage: FC<DiarySearchResultsPageProps> = ({ tags, results }) => {
  const grouped = groupByDate(results);
  const joined = tags.join(",");

  return (
    <div class="diary-search diary-day">
      <header class="diary-day-header">
        <a class="diary-back" href="/diary/search">← Back to search</a>
        <h1 class="diary-date">
          <ul class="diary-tags diary-tags-heading" aria-label="Searching">
            {tags.map((t) => (
              <li key={t}>
                <a class="diary-tag" href={`/diary?tag=${encodeURIComponent(t)}`}>
                  #{t}
                </a>
              </li>
            ))}
          </ul>
        </h1>
        <p class="diary-date-iso">
          {results.length} paragraph{results.length === 1 ? "" : "s"}
          {tags.length > 1 ? ` matching any of ${tags.length} tags` : ""}
        </p>
      </header>

      <form class="diary-search-form" method="get" action="/diary">
        <input
          class="diary-field-input"
          type="search"
          name="tag"
          value={joined}
          placeholder="tag or comma-separated tags"
          autocomplete="off"
        />
        <button class="btn btn-primary" type="submit">Search</button>
      </form>

      {results.length === 0 ? (
        <div class="diary-empty">
          <p>No paragraphs match {tags.map((t) => `#${t}`).join(", ")}.</p>
        </div>
      ) : (
        <div class="diary-search-results">
          {[...grouped.entries()].map(([date, items]) => (
            <section class="diary-search-group" key={date}>
              <h2 class="diary-search-date">
                <a href={`/diary/${date}`}>{formatAppDate(date)}</a>
              </h2>
              <ol class="diary-paragraphs">
                {items.map((p) => (
                  <li class="diary-paragraph" key={p.id}>
                    <p class="diary-paragraph-body">{p.body}</p>
                    {p.hashtags.length > 0 && (
                      <ul class="diary-tags" aria-label="Hashtags">
                        {p.hashtags.map((t) => (
                          <li key={t}>
                            <a class="diary-tag" href={`/diary?tag=${encodeURIComponent(t)}`}>
                              #{t}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
