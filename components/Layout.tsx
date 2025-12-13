import type { FC, PropsWithChildren } from "hono/jsx";
import { html } from "hono/html";
import type { Profile } from "../data/types.ts";

const ScrollEffects = () => html`
  <script type="module">
    import "/js/scroll-effects.js";
  </script>
`;

type LayoutProps = PropsWithChildren<{
  title: string;
  profile: Profile;
}>;

export const Layout: FC<LayoutProps> = ({ title, profile, children }) => {
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
              <h1 class="navbar-title-hidden">Akshay Shinde</h1>
              <div class="subtitle navbar-subtitle-shifted">Engineering with Purpose, Creativity & a Bit of Fun</div>
            </div>
            <div class="nav-links">
              <a href="/" class="nav-link">Home</a>
              <a href="/blog" class="nav-link">Blog</a>
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
      </body>
    </html>
  );
};
