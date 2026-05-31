import type { FC } from "hono/jsx";
import { navItems, isActive } from "../../data/nav.ts";

type Props = {
  currentPath?: string;
};

export const BottomSheet: FC<Props> = ({ currentPath }) => (
  <dialog id="bottom-sheet" class="bottom-sheet" data-sheet aria-label="All sections">
    <div class="bottom-sheet-inner">
      <div class="bottom-sheet-handle" aria-hidden="true" />
      <div class="bottom-sheet-header">
        <h2 class="bottom-sheet-title">Menu</h2>
        <button
          type="button"
          class="bottom-sheet-close"
          aria-label="Close menu"
          data-sheet-close
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path
              d="M5 5l14 14M19 5L5 19"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
      <nav aria-label="All sections">
        <ul class="bottom-sheet-list">
          {navItems.map((item) => {
            const active = isActive(item, currentPath);
            return (
              <li>
                <a
                  href={item.href}
                  class={`bottom-sheet-link${active ? " bottom-sheet-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  </dialog>
);
