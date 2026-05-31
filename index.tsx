import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";
import { Layout } from "./components/Layout.tsx";
import { ContributionsView } from "./components/Contributions.tsx";
import { HomePage } from "./pages/Home.tsx";
import { BlogPage } from "./pages/Blog.tsx";
import { CodePage } from "./pages/Code.tsx";
import { NotesExplorerPage } from "./pages/NotesExplorer.tsx";
import { NotesPage } from "./pages/Notes.tsx";
import profile from "./data/profile.json";
import { getContributions } from "./src/services/github/index.ts";
import { getProjects } from "./src/services/projects/index.ts";
import linodeS3 from "./src/services/linode-s3"
import { getMarkdownContent, markdownToHtml, extractToc } from "./src/services/linode-s3/markdown"
const { services: s3Service, errors } = linodeS3;


const app = new Hono();

// Explicitly serve WASM files with correct content type.
// Cache-Control is set here directly because this handler returns its own
// Response and short-circuits the static-cache middleware below.
app.get("*.wasm", async (c) => {
  const path = `./public${c.req.path}`;
  const file = Bun.file(path);
  if (await file.exists()) {
    return new Response(file, {
      headers: {
        "Content-Type": "application/wasm",
        "Cache-Control": "public, max-age=86400, must-revalidate",
      }
    });
  }
  return c.notFound();
});

// Routes
app.get("/", (c) => {
  return c.html(
    <Layout
      title={`${profile.name} - Professional Portfolio`}
      profile={profile}
      currentPath="/"
      meta={{
        description: "Akshay Shinde — Software Engineer at eBay. MS Computer Science, Oregon State. Exploring frontend development, AI, computer graphics, and software engineering.",
        ogType: "profile",
        profile: {
          firstName: "Akshay",
          lastName: "Shinde",
          username: "EdnihsYahska",
        },
        seeAlso: ["https://www.linkedin.com/in/ednihs-yahska"],
      }}
    >
      <HomePage profile={profile} />
    </Layout>
  );
});

app.get("/blog", (c) => {
  return c.html(
    <Layout title={`Blog - ${profile.name}`} profile={profile} currentPath="/blog">
      <BlogPage />
    </Layout>
  );
});

app.get("/code", (c) => {
  const projects = getProjects();
  return c.html(
    <Layout title={`Code - ${profile.name}`} profile={profile} currentPath="/code" pageSubtitle="Interactive projects and experiments">
      <CodePage projects={projects} />
    </Layout>
  );
});

// Global rate limiting for notes routes: 100 requests per hour (shared across all clients)
const notesRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 100,
  keyGenerator: () => "global", // Single key for all requests
});

app.use("/notes", notesRateLimiter);
app.use("/notes/*", notesRateLimiter);

app.get("/notes", (c) => c.redirect("/notes/"));

app.get("/notes/*", async (c) => {
  const path = c.req.path.replace("/notes/", "") || "/";

  // Handle markdown files
  if (path.endsWith(".md")) {
    console.log("In markdown");
    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";

    const safeList = (p: string) =>
      s3Service.getDirectoriesFromPath(p || "/").catch((err) => {
        console.error(`[notes] sidebar listing failed for "${p}":`, err);
        return { items: [], path: p } as Awaited<ReturnType<typeof s3Service.getDirectoriesFromPath>>;
      });

    const [markdownContent, siblingsResult, topLevelResult] = await Promise.all([
      getMarkdownContent(path),
      parentPath ? safeList(parentPath) : Promise.resolve({ items: [], path: "" }),
      safeList("/"),
    ]);

    const rawHtml = await markdownToHtml(markdownContent);
    const { html, toc } = extractToc(rawHtml);

    return c.html(
      <Layout title={`Notes - ${profile.name}`} profile={profile} currentPath="/notes" pageSubtitle="Notes from the lab">
        <NotesPage
          html={html}
          path={path}
          siblings={siblingsResult.items}
          topLevel={topLevelResult.items}
          toc={toc}
        />
      </Layout>
    );
  }

  // Handle directory listing
  console.log("In notes explorer");
  try {
    const notes = await s3Service.getDirectoriesFromPath(path);
    return c.html(
      <Layout title={`Notes - ${profile.name}`} profile={profile} currentPath="/notes" pageSubtitle="Notes from the lab">
        <NotesExplorerPage notes={notes} />
      </Layout>
    );
  } catch (e) {
    if (e instanceof errors.InvalidPath) {
      return c.redirect("/not-found");
    }
    throw e;
  }
});

// API Routes
app.get("/api/blog-posts", (c) => {
  return c.json({
    posts: [
      { id: 1, title: "Coming Soon", date: "2024", excerpt: "Blog posts coming soon..." }
    ]
  });
});

app.get("/api/contact", (c) => {
  const [username, domain] = profile.contact.email.split("@");
  return c.html(
    <div class="modal-overlay" id="contact-modal">
      <div class="modal-content">
        <button class="modal-close" onclick="document.getElementById('contact-modal').remove()">×</button>
        <h2 class="modal-title">{profile.cta.title}</h2>
        <p class="modal-subtitle">{profile.cta.subtitle}</p>
        <a href={`mailto:${profile.contact.email}`} class="modal-email-btn">
          <svg class="email-svg" viewBox="0 0 280 32" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="24" class="email-text">{username}</text>
            <g transform="translate(98, 4)" class="at-symbol">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C13.2023 20 14.34 19.7354 15.3605 19.2623C15.8616 19.03 16.4561 19.2479 16.6884 19.749C16.9207 20.25 16.7028 20.8445 16.2017 21.0768C14.923 21.6696 13.4987 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12L21.9998 12.019C21.9581 14.2089 21.2607 15.6839 20.2325 16.5993C19.2286 17.4932 18.0396 17.7368 17.2105 17.7368C16.018 17.7368 14.9711 17.1176 14.3725 16.1832C12.2959 18.0182 9.30258 18.4215 7.45418 16.3677C5.52834 14.2279 6.06522 10.6551 8.11995 8.37206C10.1079 6.1632 13.7227 5.31033 15.7981 7.86574C15.9765 7.37839 16.5038 7.1043 17.0109 7.24882C17.5421 7.40019 17.8499 7.95346 17.6986 8.4846C17.1064 10.561 16.4075 12.6179 15.8853 14.712C16.0374 15.3013 16.5739 15.7368 17.2105 15.7368C17.6895 15.7368 18.3576 15.5908 18.9026 15.1056C19.4224 14.6428 19.9646 13.7517 20 11.9905C19.9949 7.5766 16.4151 4 12 4ZM14.3531 12.914C14.4227 12.6739 14.6062 12.0326 14.8196 11.2859C15.0534 10.4669 14.7508 9.68019 14.1119 8.97025C13.1927 7.94891 11.2202 7.91706 9.60653 9.70999C7.98432 11.5125 7.92505 13.9012 8.94077 15.0298C9.85997 16.0511 11.8325 16.0829 13.4461 14.29C13.8191 13.8755 14.1704 13.4459 14.3531 12.914Z"
                fill="currentColor"
              />
            </g>
            <text x="124" y="24" class="email-text">{domain}</text>
          </svg>
        </a>
      </div>
    </div>
  );
});

app.get("/api/github-contributions", async (c) => {
  const contributions = await getContributions();
  const contributionsJSON = contributions;
  c.header("Cache-Control", "public, max-age=300");
  return c.html(
    <ContributionsView weeks={contributionsJSON?.data?.viewer?.contributionsCollection?.contributionCalendar?.weeks}/>
  )
});

// Static cache headers. Filenames aren't content-hashed, so we use
// must-revalidate rather than immutable — switch to immutable if/when
// we add hashing. The *.wasm route above sets its own Cache-Control,
// so this middleware doesn't need to handle wasm.
app.use("/*", async (c, next) => {
  await next();
  const p = c.req.path;
  if (p === "/sw.js") {
    c.header("Cache-Control", "no-cache");
  } else if (p === "/styles.css" || p.startsWith("/js/")) {
    c.header("Cache-Control", "public, max-age=3600, must-revalidate");
  } else if (p.endsWith(".wasm")) {
    c.header("Cache-Control", "public, max-age=86400, must-revalidate");
  } else if (p.startsWith("/projects-showcase/") && /\.(html|js|css)$/.test(p)) {
    c.header("Cache-Control", "public, max-age=3600");
  }
});

// Serve static files
app.use("/*", serveStatic({ root: "./public" }));

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Server running at http://localhost:3000");