import type { FC } from "hono/jsx";

export const NotesPage: FC = () => {
  return (
    <div class="notes-page">
      <header class="page-header">
        <h1 class="page-title">Notes</h1>
        <p class="page-subtitle">Thoughts, learnings, and observations</p>
      </header>
      <div class="notes-empty">
        <h3>Coming Soon</h3>
        <p>Notes and writings will appear here.</p>
      </div>
    </div>
  );
};
