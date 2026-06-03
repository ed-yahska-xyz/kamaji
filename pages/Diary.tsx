import type { FC } from "hono/jsx";
import type { DayEntry } from "../src/services/diary/index.ts";

type DiaryDayPageProps = {
  date: string;
  entry: DayEntry | null;
  isAdmin?: boolean;
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

export const DiaryDayPage: FC<DiaryDayPageProps> = ({ date, entry, isAdmin }) => {
  const paragraphs = entry?.paragraphs ?? [];

  return (
    <div class="diary-day">
      <header class="diary-day-header">
        <a class="diary-back" href="/">← Back to grid</a>
        <h1 class="diary-date">{formatDate(date)}</h1>
        <p class="diary-date-iso">{date}</p>
        {isAdmin && (
          <a class="diary-add-link" href={`/diary/new?date=${date}`}>
            + Add paragraph
          </a>
        )}
      </header>

      {paragraphs.length === 0 ? (
        <div class="diary-empty">
          <p>No entry for this day yet.</p>
        </div>
      ) : (
        <ol class="diary-paragraphs">
          {paragraphs.map((p) => (
            <li class="diary-paragraph" key={p.id}>
              <p class="diary-paragraph-body">{p.body}</p>
              {p.hashtags.length > 0 && (
                <ul class="diary-tags" aria-label="Hashtags">
                  {p.hashtags.map((tag) => (
                    <li key={tag}>
                      <a class="diary-tag" href={`/diary?tag=${encodeURIComponent(tag)}`}>
                        #{tag}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
