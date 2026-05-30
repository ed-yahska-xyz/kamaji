import type { FC } from "hono/jsx";
import type { S3ListResult } from "../src/services/linode-s3/index.ts";

const FolderIcon = () => (
  <svg
    class="notes-explorer-folder-icon"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="currentColor"
    aria-label="Directory"
    role="img"
  >
    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4.379a1.5 1.5 0 0 1 1.06.44L11.5 5.5h8A1.5 1.5 0 0 1 21 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13Z" />
  </svg>
);

type NotesExplorerPageProps = {
  notes: S3ListResult;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdated(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `UPDATED ${month} ${date.getFullYear()}`;
}

function fileKind(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "File";
  const ext = name.slice(dot + 1).toLowerCase();
  if (ext === "md" || ext === "markdown") return "Markdown";
  if (ext === "txt") return "Text";
  if (ext === "json") return "JSON";
  if (ext === "pdf") return "PDF";
  return ext.toUpperCase();
}

function fileMeta(name: string, size?: number): string {
  const kind = fileKind(name);
  return size != null ? `${kind} · ${formatBytes(size)}` : kind;
}

export const NotesExplorerPage: FC<NotesExplorerPageProps> = ({ notes }) => {
  const normalizedPath = notes.path.replace(/^\/|\/$/g, "");
  const segments = normalizedPath ? normalizedPath.split("/") : [];
  const folderCount = notes.items.filter((i) => i.type === "directory").length;
  const fileCount = notes.items.filter((i) => i.type === "file").length;
  const heading = segments.length
    ? segments[segments.length - 1]!.replace(/[_-]/g, " ").toUpperCase()
    : "NOTES FROM THE LAB";

  return (
    <div class="notes-page notes-explorer">
      <nav class="notes-breadcrumb" aria-label="Breadcrumb">
        <a href="/notes/">NOTES</a>
        {segments.map((seg, i) => {
          const href = "/notes/" + segments.slice(0, i + 1).join("/") + "/";
          return (
            <>
              <span class="notes-breadcrumb-sep" aria-hidden="true">/</span>
              <a href={href}>{seg.toUpperCase()}</a>
            </>
          );
        })}
      </nav>

      <header class="notes-explorer-header">
        <h1 class="notes-explorer-title">{heading}</h1>
        <div class="notes-explorer-counts">
          {folderCount > 0 && (
            <span>{folderCount} {folderCount === 1 ? "FOLDER" : "FOLDERS"}</span>
          )}
          {folderCount > 0 && fileCount > 0 && (
            <span class="notes-explorer-counts-sep" aria-hidden="true">·</span>
          )}
          {fileCount > 0 && (
            <span>{fileCount} {fileCount === 1 ? "FILE" : "FILES"}</span>
          )}
          {folderCount === 0 && fileCount === 0 && <span>EMPTY</span>}
        </div>
      </header>

      {notes.items.length > 0 ? (
        <ol class="notes-explorer-list">
          {notes.items.map((item, idx) => {
            const href = `/notes/${normalizedPath ? normalizedPath + "/" : ""}${item.name}${item.type === "directory" ? "/" : ""}`;
            const updated = formatUpdated(item.lastModified);
            return (
              <li class="notes-explorer-row">
                <a href={href} class="notes-explorer-link">
                  <span class="notes-explorer-index">{String(idx + 1).padStart(2, "0")}</span>
                  <div class="notes-explorer-main">
                    <span class="notes-explorer-name">{item.name.toUpperCase()}</span>
                  </div>
                  <div class="notes-explorer-meta">
                    <span class="notes-explorer-meta-primary">
                      {item.type === "directory" ? <FolderIcon /> : fileMeta(item.name, item.size)}
                    </span>
                    {updated && (
                      <span class="notes-explorer-meta-secondary">{updated}</span>
                    )}
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <div class="notes-empty">
          <h3>No notes yet</h3>
          <p>Notes and writings will appear here.</p>
        </div>
      )}
    </div>
  );
};
