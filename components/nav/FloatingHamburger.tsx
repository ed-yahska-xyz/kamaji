import type { FC } from "hono/jsx";

export const FloatingHamburger: FC = () => (
  <button
    type="button"
    class="floating-hamburger"
    aria-label="Open menu"
    aria-controls="nav-menu"
    aria-expanded="false"
    data-nav-toggle
  >
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="round"
      />
    </svg>
  </button>
);
