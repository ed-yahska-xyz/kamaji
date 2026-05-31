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

type MetaProps = {
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  seeAlso?: string[];
};

type LayoutProps = PropsWithChildren<{
  title: string;
  profile: Profile;
  currentPath?: string;
  pageSubtitle?: string;
  meta?: MetaProps;
}>;

export const Layout: FC<LayoutProps> = ({ title, profile, currentPath, pageSubtitle, meta, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {meta && (
          <>
            <meta name="description" content={meta.description} />
            <meta property="og:title" content={meta.ogTitle || title} />
            <meta property="og:description" content={meta.ogDescription || meta.description} />
            <meta property="og:type" content={meta.ogType || "website"} />
            {meta.ogUrl && <meta property="og:url" content={meta.ogUrl} />}
            {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
            <meta name="twitter:card" content={meta.twitterCard || "summary"} />
            <meta name="twitter:title" content={meta.ogTitle || title} />
            <meta name="twitter:description" content={meta.ogDescription || meta.description} />
            {meta.ogImage && <meta name="twitter:image" content={meta.ogImage} />}
            {meta.profile?.firstName && <meta property="profile:first_name" content={meta.profile.firstName} />}
            {meta.profile?.lastName && <meta property="profile:last_name" content={meta.profile.lastName} />}
            {meta.profile?.username && <meta property="profile:username" content={meta.profile.username} />}
            {meta.seeAlso?.map((url) => <link rel="me" href={url} />)}
          </>
        )}
        <link rel="stylesheet" href="/styles.css" />
        {/* htmx v1.9.10 — self-hosted; bump devDep in package.json to upgrade */}
        <script src="/js/htmx.min.js" defer></script>
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
