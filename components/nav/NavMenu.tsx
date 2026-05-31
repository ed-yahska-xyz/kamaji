import type { FC } from "hono/jsx";
import { navItems, isActive } from "../../data/nav.ts";

type Props = {
  currentPath?: string;
};

export const NavMenu: FC<Props> = ({ currentPath }) => (
  <nav
    id="nav-menu"
    class="nav-menu"
    aria-label="Primary"
    data-nav-menu
    hidden
  >
    <ul class="nav-menu-list">
      {navItems.map((item) => {
        const active = isActive(item, currentPath);
        return (
          <li>
            <a
              href={item.href}
              class={`nav-menu-link${active ? " nav-menu-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  </nav>
);
