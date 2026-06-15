import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";
import { Layout } from "./components/Layout.tsx";
import { HomePage } from "./pages/Home.tsx";
import { BlogPage } from "./pages/Blog.tsx";
import { CodePage } from "./pages/Code.tsx";
import { DiaryDayPage } from "./pages/Diary.tsx";
import { DiaryLoginPage } from "./pages/DiaryLogin.tsx";
import { DiaryTwoFactorPage } from "./pages/DiaryTwoFactor.tsx";
import { DiaryNewPage } from "./pages/DiaryNew.tsx";
import { DiarySearchPage } from "./pages/DiarySearch.tsx";
import { DiarySearchResultsPage } from "./pages/DiarySearchResults.tsx";
import { NotesExplorerPage } from "./pages/NotesExplorer.tsx";
import { NotesPage } from "./pages/Notes.tsx";
import profile from "./data/profile.json";
import { buildGridWindow } from "./components/Diary.tsx";
import {
  createParagraph,
  getAllTags,
  getEntryByDate,
  getParagraphCountsByDateRange,
  hasDb,
  isAdmin,
  searchByTags,
  toAppISODate,
  type DayCount,
} from "./src/services/diary/index.ts";
import { auth, hasAuth, authBaseUrl } from "./src/services/auth/index.ts";
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
app.get("/", async (c) => {
  let dayCounts: DayCount[] = [];
  if (hasDb()) {
    const { start, end } = buildGridWindow();
    try {
      dayCounts = await getParagraphCountsByDateRange(start, end);
    } catch (err) {
      console.error("[home] diary query failed:", err);
    }
  }
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
      <HomePage profile={profile} dayCounts={dayCounts} />
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayIso = () => toAppISODate();

const loginBaseUrl = authBaseUrl;

// Where to send the user after a successful sign-in. Resolves `next` against our
// own origin and only allows the result if it lands on ed-yahska.xyz or a
// subdomain (so the Jupyter forward-auth bounce can return the user to the lab);
// anything else falls back to the diary.
//
// Resolving through the URL parser — instead of string checks — is what closes
// the open-redirect holes: protocol-relative ("//evil.com"), backslash
// ("/\\evil.com", which browsers fold to "//evil.com"), userinfo
// ("https://ed-yahska.xyz@evil.com"), and non-http schemes ("javascript:...")
// all resolve to a hostname/scheme that fails the allowlist below.
function safeRedirect(next: string | null | undefined, fallback = "/diary/new"): string {
  if (!next) return fallback;

  let base: URL;
  try {
    base = new URL(loginBaseUrl);
  } catch {
    base = new URL("https://ed-yahska.xyz");
  }

  let target: URL;
  try {
    target = new URL(next, base);
  } catch {
    return fallback;
  }

  const hostAllowed =
    target.hostname === base.hostname ||
    target.hostname === "ed-yahska.xyz" ||
    target.hostname.endsWith(".ed-yahska.xyz");
  // https in prod; also accept the base's own scheme so http://localhost works in dev.
  const protoAllowed = target.protocol === "https:" || target.protocol === base.protocol;

  return hostAllowed && protoAllowed ? target.href : fallback;
}

function parseTagsParam(raw: string | undefined): string[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ];
}

app.get("/diary/search", async (c) => {
  const allTags = hasDb()
    ? await getAllTags().catch((err) => {
        console.error("[diary] getAllTags failed:", err);
        return [];
      })
    : [];

  return c.html(
    <Layout
      title={`Search diary - ${profile.name}`}
      profile={profile}
      currentPath="/diary"
      pageSubtitle="Search by tag"
    >
      <DiarySearchPage allTags={allTags} initialQuery={c.req.query("q") ?? ""} />
    </Layout>,
  );
});

app.get("/diary", async (c) => {
  const tags = parseTagsParam(c.req.query("tag"));
  if (tags.length === 0) return c.redirect("/diary/search");

  const results = hasDb()
    ? await searchByTags(tags).catch((err) => {
        console.error(`[diary] search failed for ${tags.join(",")}:`, err);
        return [];
      })
    : [];

  const titleTags = tags.map((t) => `#${t}`).join(" ");
  return c.html(
    <Layout
      title={`Diary · ${titleTags} - ${profile.name}`}
      profile={profile}
      currentPath="/diary"
      pageSubtitle={`Search ${titleTags}`}
    >
      <DiarySearchResultsPage tags={tags} results={results} />
    </Layout>,
  );
});

// Better Auth mount — owns /api/auth/sign-in/email, /sign-out, /get-session, etc.
if (auth) {
  const authInstance = auth;
  app.on(["GET", "POST"], "/api/auth/*", (c) => authInstance.handler(c.req.raw));
}

// Caddy `forward_auth` target for jupyter.ed-yahska.xyz. Caddy sub-requests
// this with the browser's cookies on every Jupyter request: 200 -> allow,
// 302 -> Caddy returns the redirect as-is, bouncing the user to sign in.
// Mounted at the root (not under /api/auth/*, which Better Auth owns).
app.get("/forward-auth", async (c) => {
  if (!auth) return c.text("Auth unavailable", 503);
  // disableCookieCache: this gate guards shell access, so it must read the DB
  // and honor session revocation immediately rather than trust the (up to
  // 5-min) signed cookie cache.
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
    query: { disableCookieCache: true },
  });
  if (session?.user) {
    c.header("X-User-Email", session.user.email);
    return c.body(null, 200);
  }
  const proto = c.req.header("X-Forwarded-Proto") ?? "https";
  const host = c.req.header("X-Forwarded-Host") ?? "jupyter.ed-yahska.xyz";
  const uri = c.req.header("X-Forwarded-Uri") ?? "/";
  const target = `${proto}://${host}${uri}`;
  return c.redirect(`${loginBaseUrl}/diary/login?next=${encodeURIComponent(target)}`, 302);
});

// Throttle credential + 2FA verification attempts so the 6-digit TOTP space
// can't be brute-forced within the two-factor cookie's ~10 min lifetime. Keyed
// per client IP (Caddy sets X-Forwarded-For), with a shared fallback. Only
// POSTs count — GET renders of the forms pass through.
const authRateLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  // Use the LAST X-Forwarded-For entry — the address Caddy appends — not the
  // client-supplied leftmost value, which is spoofable and would let an
  // attacker rotate keys to dodge the limit. (kamaji is only reachable via
  // Caddy, so the appended entry is the real client.)
  keyGenerator: (c) => c.req.header("x-forwarded-for")?.split(",").pop()?.trim() || "global",
  skip: (c) => c.req.method !== "POST",
  message: "Too many attempts. Wait a few minutes and try again.",
});
app.use("/diary/login", authRateLimiter);
app.use("/diary/2fa", authRateLimiter);

app.get("/diary/login", async (c) => {
  if (!hasAuth()) return c.text("Auth unavailable", 503);
  const next = safeRedirect(c.req.query("next"));
  if (await isAdmin(c)) return c.redirect(next);
  return c.html(
    <Layout
      title={`Sign in - ${profile.name}`}
      profile={profile}
      currentPath="/diary"
      pageSubtitle="Daily diary"
    >
      <DiaryLoginPage next={next} />
    </Layout>,
  );
});

// Form wrapper around Better Auth's JSON sign-in endpoint. Lets us use a
// plain HTML form (no JS) and forward the auth cookies into our redirect.
app.post("/diary/login", async (c) => {
  if (!auth) return c.text("Auth unavailable", 503);
  const form = await c.req.parseBody();
  const email = String(form.email ?? "").trim();
  const password = String(form.password ?? "");
  const next = safeRedirect(String(form.next ?? "").trim());

  const renderError = (status: 400 | 401, error: string) =>
    c.html(
      <Layout
        title={`Sign in - ${profile.name}`}
        profile={profile}
        currentPath="/diary"
        pageSubtitle="Daily diary"
      >
        <DiaryLoginPage next={next} error={error} email={email} />
      </Layout>,
      status,
    );

  if (!email || !password) return renderError(400, "Email and password are required.");

  let authResp: Response;
  try {
    authResp = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });
  } catch (err) {
    console.error("[diary] sign-in threw:", err);
    return renderError(401, "Invalid email or password.");
  }

  if (!authResp.ok) {
    return renderError(401, "Invalid email or password.");
  }

  const setCookies = authResp.headers.getSetCookie?.() ?? [];

  // If the account has 2FA enabled, Better Auth returns `twoFactorRedirect`
  // and a short-lived two-factor cookie instead of a full session. Forward
  // that cookie and send the user to the code-entry step.
  const payload = (await authResp
    .clone()
    .json()
    .catch(() => null)) as { twoFactorRedirect?: boolean } | null;
  if (payload?.twoFactorRedirect) {
    const redirect = c.redirect(`/diary/2fa?next=${encodeURIComponent(next)}`);
    for (const cookie of setCookies) {
      redirect.headers.append("Set-Cookie", cookie);
    }
    return redirect;
  }

  const redirect = c.redirect(next);
  for (const cookie of setCookies) {
    redirect.headers.append("Set-Cookie", cookie);
  }
  return redirect;
});

// Second sign-in step for 2FA-enabled accounts. The two-factor cookie set by
// the login POST identifies the pending sign-in; verifyTOTP exchanges a valid
// code for a full session cookie.
app.get("/diary/2fa", (c) => {
  if (!hasAuth()) return c.text("Auth unavailable", 503);
  const next = safeRedirect(c.req.query("next"));
  // No pending sign-in (no two-factor cookie) → nothing to verify; send to login.
  // Substring match covers the prod "__Secure-" cookie prefix.
  if (!c.req.header("cookie")?.includes("two_factor")) {
    return c.redirect(`/diary/login?next=${encodeURIComponent(next)}`);
  }
  return c.html(
    <Layout
      title={`Two-factor - ${profile.name}`}
      profile={profile}
      currentPath="/diary"
      pageSubtitle="Daily diary"
    >
      <DiaryTwoFactorPage next={next} />
    </Layout>,
  );
});

app.post("/diary/2fa", async (c) => {
  if (!auth) return c.text("Auth unavailable", 503);
  const form = await c.req.parseBody();
  const code = String(form.code ?? "").trim();
  const next = safeRedirect(String(form.next ?? "").trim());

  const renderError = (error: string) =>
    c.html(
      <Layout
        title={`Two-factor - ${profile.name}`}
        profile={profile}
        currentPath="/diary"
        pageSubtitle="Daily diary"
      >
        <DiaryTwoFactorPage next={next} error={error} />
      </Layout>,
      401,
    );

  if (!code) return renderError("Enter your authentication or backup code.");

  // A plain 6-digit code is a TOTP; anything else (backup codes are
  // "xxxxx-xxxxx", alphanumeric) is treated as a backup code. Both verify
  // against the two-factor cookie set during the login step.
  const isTotp = /^\d{6}$/.test(code);
  let verifyResp: Response;
  try {
    verifyResp = isTotp
      ? await auth.api.verifyTOTP({
          body: { code },
          headers: c.req.raw.headers, // carries the two-factor cookie
          asResponse: true,
        })
      : await auth.api.verifyBackupCode({
          body: { code },
          headers: c.req.raw.headers,
          asResponse: true,
        });
  } catch (err) {
    console.error("[diary] 2FA verify threw:", err);
    return renderError("Invalid or expired code.");
  }

  if (!verifyResp.ok) return renderError("Invalid or expired code.");

  const setCookies = verifyResp.headers.getSetCookie?.() ?? [];
  const redirect = c.redirect(next);
  for (const cookie of setCookies) {
    redirect.headers.append("Set-Cookie", cookie);
  }
  return redirect;
});

app.get("/diary/logout", async (c) => {
  if (auth) {
    try {
      await auth.api.signOut({ headers: c.req.raw.headers });
    } catch (err) {
      console.error("[diary] sign-out failed:", err);
    }
  }
  return c.redirect("/");
});

app.get("/diary/new", async (c) => {
  if (!(await isAdmin(c))) return c.redirect("/diary/login?next=/diary/new");
  const date = c.req.query("date");
  const defaultDate = date && DATE_RE.test(date) ? date : todayIso();
  return c.html(
    <Layout
      title={`New diary entry - ${profile.name}`}
      profile={profile}
      currentPath="/diary"
      pageSubtitle="Daily diary"
    >
      <DiaryNewPage defaultDate={defaultDate} />
    </Layout>
  );
});

app.post("/api/diary/paragraphs", async (c) => {
  if (!(await isAdmin(c))) return c.text("Unauthorized", 401);

  const form = await c.req.parseBody();
  const date = String(form.date ?? "").trim();
  const body = String(form.body ?? "").trim();

  const render = (error: string, status: 400 | 503) =>
    c.html(
      <Layout
        title={`New diary entry - ${profile.name}`}
        profile={profile}
        currentPath="/diary"
        pageSubtitle="Daily diary"
      >
        <DiaryNewPage defaultDate={date || todayIso()} body={body} error={error} />
      </Layout>,
      status,
    );

  if (!DATE_RE.test(date)) return render("Date must be in YYYY-MM-DD format.", 400);
  if (!body) return render("Paragraph body cannot be empty.", 400);
  if (!hasDb()) return render("Database unavailable.", 503);

  try {
    await createParagraph({ date, body });
  } catch (err) {
    console.error("[diary] createParagraph failed:", err);
    return render("Failed to save paragraph. Check server logs.", 503);
  }

  return c.redirect(`/diary/${date}`);
});

app.get("/diary/:date", async (c) => {
  const date = c.req.param("date");
  if (!DATE_RE.test(date)) return c.notFound();

  const [entry, admin] = await Promise.all([
    hasDb()
      ? getEntryByDate(date).catch((err) => {
          console.error(`[diary] lookup failed for ${date}:`, err);
          return null;
        })
      : Promise.resolve(null),
    isAdmin(c),
  ]);

  return c.html(
    <Layout
      title={`Diary · ${date} - ${profile.name}`}
      profile={profile}
      currentPath="/diary"
      pageSubtitle="Daily diary"
    >
      <DiaryDayPage date={date} entry={entry} isAdmin={admin} />
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