import type { FC } from "hono/jsx";
import type { TaggedParagraph } from "../src/services/diary/index.ts";

type DiarySearchPageProps = {
  tag: string;
  results: TaggedParagraph[];
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function groupByDate(rows: TaggedParagraph[]): Map<string, TaggedParagraph[]> {
  const out = new Map<string, TaggedParagraph[]>();
  for (const r of rows) {
    const arr = out.get(r.date) ?? [];
    arr.push(r);
    out.set(r.date, arr);
  }
  return out;
}

export const DiarySearchPage: FC<DiarySearchPageProps> = ({ tag, results }) => {
  const grouped = groupByDate(results);

  return (
    <div class="diary-search diary-day">
      <header class="diary-day-header">
        <a class="diary-back" href="/">← Back to grid</a>
        <h1 class="diary-date">#{tag}</h1>
        <p class="diary-date-iso">
          {results.length} paragraph{results.length === 1 ? "" : "s"}
        </p>
      </header>

      <form class="diary-search-form" method="get" action="/diary">
        <input
          class="diary-field-input"
          type="search"
          name="tag"
          value={tag}
          placeholder="hashtag (without #)"
          autocomplete="off"
        />
        <button class="btn btn-primary" type="submit">Search</button>
      </form>

      {results.length === 0 ? (
        <div class="diary-empty">
          <p>No paragraphs tagged #{tag}.</p>
        </div>
      ) : (
        <div class="diary-search-results">
          {[...grouped.entries()].map(([date, items]) => (
            <section class="diary-search-group" key={date}>
              <h2 class="diary-search-date">
                <a href={`/diary/${date}`}>{formatDate(date)}</a>
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
