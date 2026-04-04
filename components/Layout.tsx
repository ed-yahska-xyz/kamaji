import type { FC, PropsWithChildren } from "hono/jsx";
import { html } from "hono/html";
import type { Profile } from "../data/types.ts";

const ScrollEffects = () => html`
  <script type="module">
    import "/js/scroll-effects.js";
  </script>
`;

const ServiceWorkerRegister = () => html`
  <script type="module">
    import "/js/sw-register.js";
  </script>
`;

type LayoutProps = PropsWithChildren<{
  title: string;
  profile: Profile;
  currentPath?: string;
  pageSubtitle?: string;
}>;

export const Layout: FC<LayoutProps> = ({ title, profile, currentPath, pageSubtitle, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      </head>
      <body>
        <nav class="navbar">
          <div class="container">
            <div class="nav-brand">
              <h1 class={currentPath === "/" ? "navbar-title-hidden" : ""}>
                {currentPath === "/code" ? "Code"
                  : currentPath === "/notes" ? "Notes"
                  : currentPath === "/blog" ? "Blog"
                  : "Akshay Shinde"}
              </h1>
              <div class={currentPath === "/" ? "subtitle navbar-subtitle-shifted" : "subtitle"}>
                {pageSubtitle || "Engineering with Purpose, Creativity & a Lot of Fun"}
              </div>
            </div>
            <div class="nav-links">
              {currentPath !== "/" && <a href="/" class="nav-link">Home</a>}
              {currentPath !== "/code" && <a href="/code" class="nav-link">Code</a>}
              {currentPath !== "/notes" && <a href="/notes" class="nav-link">Notes</a>}
            </div>
          </div>
        </nav>

        <main class="container">
          {children}
        </main>

        <footer class="footer">
          <div class="container">
            <p>&copy; {profile.footer.copyright}. {profile.footer.tagline}</p>
          </div>
        </footer>
        <ScrollEffects />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
};
