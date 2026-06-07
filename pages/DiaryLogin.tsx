import type { FC } from "hono/jsx";

type DiaryLoginPageProps = {
  next: string;
  error?: string;
  email?: string;
};

export const DiaryLoginPage: FC<DiaryLoginPageProps> = ({ next, error, email }) => {
  return (
    <div class="diary-new">
      <header class="diary-day-header">
        <a class="diary-back" href="/">← Back to grid</a>
        <h1 class="diary-date">Sign in</h1>
        <p class="diary-date-iso">Admin only</p>
      </header>

      {error && <div class="diary-form-error">{error}</div>}

      <form class="diary-new-form" method="post" action="/diary/login">
        <input type="hidden" name="next" value={next} />
        <label class="diary-field">
          <span class="diary-field-label">Email</span>
          <input
            class="diary-field-input"
            type="email"
            name="email"
            value={email ?? ""}
            autocomplete="username"
            required
          />
        </label>

        <label class="diary-field">
          <span class="diary-field-label">Password</span>
          <input
            class="diary-field-input"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
        </label>

        <div class="diary-new-actions">
          <button class="btn btn-primary" type="submit">Sign in</button>
        </div>
      </form>
    </div>
  );
};
