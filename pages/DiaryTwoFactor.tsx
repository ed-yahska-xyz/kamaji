import type { FC } from "hono/jsx";

type DiaryTwoFactorPageProps = {
  next: string;
  error?: string;
};

// Second step of sign-in: shown after email/password when the account has TOTP
// two-factor enabled. Posts the code to /diary/2fa, which accepts either a
// 6-digit TOTP code or a backup code (format "xxxxx-xxxxx") and forwards the
// resulting session cookie.
export const DiaryTwoFactorPage: FC<DiaryTwoFactorPageProps> = ({ next, error }) => {
  return (
    <div class="diary-new">
      <header class="diary-day-header">
        <a class="diary-back" href="/">← Back to grid</a>
        <h1 class="diary-date">Two-factor</h1>
        <p class="diary-date-iso">Enter the code from your authenticator app, or a backup code</p>
      </header>

      {error && <div class="diary-form-error">{error}</div>}

      <form class="diary-new-form" method="post" action="/diary/2fa">
        <input type="hidden" name="next" value={next} />
        <label class="diary-field">
          <span class="diary-field-label">Authentication or backup code</span>
          <input
            class="diary-field-input"
            type="text"
            name="code"
            autocomplete="one-time-code"
            autocapitalize="off"
            spellcheck={false}
            autofocus
            required
          />
        </label>

        <div class="diary-new-actions">
          <button class="btn btn-primary" type="submit">Verify</button>
        </div>
      </form>
    </div>
  );
};
