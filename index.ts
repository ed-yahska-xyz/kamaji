import index from "./public/index.html";
import blog from "./public/blog.html";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/blog": blog,
    "/api/blog-posts": {
      GET: () => {
        return new Response(JSON.stringify({
          posts: [
            { id: 1, title: "Coming Soon", date: "2024", excerpt: "Blog posts coming soon..." }
          ]
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  },
  development: {
    hmr: true,
    console: true,
  }
});

console.log(`Listening on ${server.url}`);

