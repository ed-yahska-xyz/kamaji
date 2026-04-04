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
        <ul class="list-view">
          {notes.items.map((item) => (
            <li class="list-item">
              <a
                href={`/notes/${normalizedPath ? normalizedPath + "/" : ""}${item.name}`}
                class="list-item-link"
              >
                <span class="list-item-icon">
                  {item.type === "directory" ? "📁" : "📄"}
                </span>
                <span class="list-item-title">{item.name}</span>
                <span class="list-item-arrow">&rarr;</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div class="notes-empty">
          <h3>No notes yet</h3>
          <p>Notes and writings will appear here.</p>
        </div>
      )}
    </div>
  );
};
