import type { FC } from "hono/jsx";
import type { S3ListResult } from "../src/services/linode-s3/index.ts";

type NotesExplorerPageProps = {
  notes: S3ListResult;
};

export const NotesExplorerPage: FC<NotesExplorerPageProps> = ({ notes }) => {
  const hasItems = notes.items.length > 0;
  // Normalize path: remove leading/trailing slashes for consistent URL building
  const normalizedPath = notes.path.replace(/^\/|\/$/g, "");

  return (
    <div class="notes-page">
      {hasItems ? (
        <div class="projects-grid">
          {notes.items.map((item) => (
            <a
              href={`/notes/${normalizedPath ? normalizedPath + "/" : ""}${item.name}`}
              class="project-card"
            >
              <div class="project-card-content">
                <span class="project-card-icon">
                  {item.type === "directory" ? "📁" : "📄"}
                </span>
                <h2 class="project-card-title">{item.name}</h2>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div class="notes-empty">
          <h3>No notes yet</h3>
          <p>Notes and writings will appear here.</p>
        </div>
      )}
    </div>
  );
};
