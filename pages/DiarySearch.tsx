import type { FC } from "hono/jsx";
import type { TagCount } from "../src/services/diary/index.ts";

type DiarySearchPageProps = {
  allTags: TagCount[];
  initialQuery?: string;
};

export const DiarySearchPage: FC<DiarySearchPageProps> = ({ allTags, initialQuery }) => {
  return (
    <div class="diary-search-form-page diary-day">
      <header class="diary-day-header">
        <a class="diary-back" href="/">← Back to grid</a>
        <h1 class="diary-date">Search</h1>
        <p class="diary-date-iso">
          Type a tag, or several separated by commas.
        </p>
      </header>

      <form class="diary-search-form" method="get" action="/diary">
        <input
          class="diary-field-input"
          type="search"
          name="tag"
          value={initialQuery ?? ""}
          placeholder="e.g. auth, ship  (matches any of)"
          autocomplete="off"
          autofocus
        />
        <button class="btn btn-primary" type="submit">Search</button>
      </form>

      {allTags.length === 0 ? (
        <div class="diary-empty">
          <p>No hashtags yet. Add a paragraph with a #tag to seed the cloud.</p>
        </div>
      ) : (
        <section class="diary-tag-cloud-section">
          <h2 class="diary-search-date">All tags ({allTags.length})</h2>
          <ul class="diary-tag-cloud" aria-label="All hashtags">
            {allTags.map(({ tag, count }) => (
              <li key={tag}>
                <a class="diary-tag" href={`/diary?tag=${encodeURIComponent(tag)}`}>
                  #{tag}
                  <span class="diary-tag-count" aria-label={`${count} occurrences`}>
                    {count}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
