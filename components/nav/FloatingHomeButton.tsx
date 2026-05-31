import type { FC } from "hono/jsx";

export const FloatingHomeButton: FC = () => (
  <a class="floating-home" href="/" aria-label="Home">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V11z"
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  </a>
);
