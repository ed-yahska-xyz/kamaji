import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Layout } from "./components/Layout.tsx";
import { HomePage } from "./pages/Home.tsx";
import { BlogPage } from "./pages/Blog.tsx";
import profile from "./data/profile.json";

const app = new Hono();

// Serve static files (CSS)
app.use("/styles.css", serveStatic({ path: "./public/styles.css" }));

// Routes
app.get("/", (c) => {
  return c.html(
    <Layout title={`${profile.name} - Professional Portfolio`} profile={profile}>
      <HomePage profile={profile} />
    </Layout>
  );
});

app.get("/blog", (c) => {
  return c.html(
    <Layout title={`Blog - ${profile.name}`} profile={profile}>
      <BlogPage />
    </Layout>
  );
});

// API Routes
app.get("/api/blog-posts", (c) => {
  return c.json({
    posts: [
      { id: 1, title: "Coming Soon", date: "2024", excerpt: "Blog posts coming soon..." }
    ]
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Server running at http://localhost:3000");
