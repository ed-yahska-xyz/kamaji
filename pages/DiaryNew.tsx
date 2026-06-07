import type { FC } from "hono/jsx";

type DiaryNewPageProps = {
  defaultDate: string;
  error?: string;
  body?: string;
};

export const DiaryNewPage: FC<DiaryNewPageProps> = ({ defaultDate, error, body }) => {
  return (
    <div class="diary-new">
      <header class="diary-day-header">
        <a class="diary-back" href="/">← Back to grid</a>
        <h1 class="diary-date">New paragraph</h1>
        <p class="diary-date-iso">Writing as admin</p>
      </header>

      {error && <div class="diary-form-error">{error}</div>}

      <form class="diary-new-form" method="post" action="/api/diary/paragraphs">
        <label class="diary-field">
          <span class="diary-field-label">Date</span>
          <input
            class="diary-field-input"
            type="date"
            name="date"
            value={defaultDate}
            required
          />
        </label>

        <label class="diary-field">
          <span class="diary-field-label">Paragraph</span>
          <textarea
            class="diary-field-textarea"
            name="body"
            rows={8}
            placeholder="What happened today? Use #hashtags to make it searchable."
            required
          >{body ?? ""}</textarea>
        </label>

        <div class="diary-new-actions">
          <button class="btn btn-primary" type="submit">Save paragraph</button>
          <a class="diary-back" href="/diary/logout">Log out</a>
        </div>
      </form>
    </div>
  );
};
