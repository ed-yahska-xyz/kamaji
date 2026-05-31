import type { FC } from "hono/jsx";
import { navItems, isActive, MAX_TABS } from "../../data/nav.ts";

type Props = {
  currentPath?: string;
};

export const TabBar: FC<Props> = ({ currentPath }) => {
  const needsMore = navItems.length > MAX_TABS;
  const visible = needsMore ? navItems.slice(0, MAX_TABS - 1) : navItems;

  return (
    <nav class="tab-bar" aria-label="Primary mobile">
      <ul class="tab-bar-list">
        {visible.map((item) => {
          const active = isActive(item, currentPath);
          return (
            <li class="tab-bar-item">
              <a
                href={item.href}
                class={`tab${active ? " tab-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span class="tab-label">{item.label}</span>
              </a>
            </li>
          );
        })}
        {needsMore && (
          <li class="tab-bar-item">
            <button
              type="button"
              class="tab tab-more"
              aria-label="More options"
              aria-controls="bottom-sheet"
              data-sheet-open
            >
              <span class="tab-label">More</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};
