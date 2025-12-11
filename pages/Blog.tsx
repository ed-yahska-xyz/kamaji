import { html } from "hono/html";
import type { FC } from "hono/jsx";

export const BlogPage: FC = () => {
  return (
    <>
      <header class="blog-header">
        <h1 class="blog-title">Blog</h1>
        <p class="blog-subtitle">Thoughts on tech, code, and creative computing</p>
      </header>

      <div class="blog-container">
        <div class="filter-section">
          <button
            class="filter-btn active"
            hx-get="/api/blog-posts"
            hx-target="#blog-posts"
            hx-swap="innerHTML"
          >
            All Posts
          </button>
          <button
            class="filter-btn"
            hx-get="/api/blog-posts?tag=frontend"
            hx-target="#blog-posts"
            hx-swap="innerHTML"
          >
            Frontend
          </button>
          <button
            class="filter-btn"
            hx-get="/api/blog-posts?tag=ai"
            hx-target="#blog-posts"
            hx-swap="innerHTML"
          >
            AI
          </button>
          <button
            class="filter-btn"
            hx-get="/api/blog-posts?tag=graphics"
            hx-target="#blog-posts"
            hx-swap="innerHTML"
          >
            Graphics
          </button>
        </div>

        <div
          id="blog-posts"
          hx-get="/api/blog-posts"
          hx-trigger="load"
          hx-swap="innerHTML"
        >
          <div class="blog-loading">Loading posts...</div>
        </div>
      </div>

      {html`
        <script>
          document.addEventListener('htmx:afterSwap', function(evt) {
            if (evt.detail.target.id === 'blog-posts') {
              document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
              });
              if (evt.detail.xhr.responseURL.includes('blog-posts')) {
                const clickedBtn = document.querySelector('[hx-get="' + evt.detail.xhr.responseURL.split(window.location.origin)[1] + '"]');
                if (clickedBtn) clickedBtn.classList.add('active');
              }
            }
          });
        </script>
      `}
    </>
  );
};
