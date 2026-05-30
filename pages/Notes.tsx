import type { FC } from "hono/jsx";
import type { S3Item } from "../src/services/linode-s3/index.ts";
import type { TocEntry } from "../src/services/linode-s3/markdown.ts";

interface NotesPageProps {
  html: string;
  path: string;
  siblings?: S3Item[];
  topLevel?: S3Item[];
  toc?: TocEntry[];
}

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4.379a1.5 1.5 0 0 1 1.06.44L11.5 5.5h8A1.5 1.5 0 0 1 21 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13Z" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M6 2.5A1.5 1.5 0 0 1 7.5 1h7l5 5v15.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5.5 21.5v-19A1.5 1.5 0 0 1 7 1Z" opacity="0.15" />
    <path d="M14.5 1H7.5A1.5 1.5 0 0 0 6 2.5v19A1.5 1.5 0 0 0 7.5 23h11a1.5 1.5 0 0 0 1.5-1.5V6.5L14.5 1Zm0 1.7L18.3 6.5H15a.5.5 0 0 1-.5-.5V2.7Z" />
  </svg>
);

function prettyName(name: string): string {
  return name.replace(/\.md$/i, "").replace(/[_-]+/g, " ").toUpperCase();
}

export const NotesPage: FC<NotesPageProps> = ({ html, path, siblings, topLevel, toc }) => {
  const normalizedPath = path.replace(/^\/|\/$/g, "");
  const segments = normalizedPath ? normalizedPath.split("/") : [];
  const fileName = segments[segments.length - 1] ?? "";
  const parentSegments = segments.slice(0, -1);
  const parentPath = parentSegments.join("/");
  const parentName = parentSegments[parentSegments.length - 1] ?? "";
  const title = prettyName(fileName);

  const sidebarSections = (topLevel ?? []).filter((i) => i.type === "directory");
  const siblingItems = siblings ?? [];

  return (
    <div class="notes-page notes-doc">
      <aside class="notes-doc-sidebar" aria-label="Notes navigation">
        <div class="notes-doc-sidebar-header">
          <a href="/notes/" class="notes-doc-sidebar-brand">NOTES</a>
          <span class="notes-doc-sidebar-subtitle">NOTES FROM THE LAB</span>
        </div>
        <nav class="notes-doc-tree">
          {sidebarSections.length > 0 ? (
            <ul class="notes-doc-tree-list">
              {sidebarSections.map((section) => {
                const isCurrent = section.name === parentName;
                return (
                  <li class={`notes-doc-tree-item${isCurrent ? " is-current" : ""}`}>
                    <a href={`/notes/${section.name}/`} class="notes-doc-tree-dir">
                      <FolderIcon />
                      <span>{section.name.toUpperCase()}</span>
                    </a>
                    {isCurrent && siblingItems.length > 0 && (
                      <ul class="notes-doc-tree-children">
                        {siblingItems.map((child) => {
                          const childHref = `/notes/${parentPath ? parentPath + "/" : ""}${child.name}${child.type === "directory" ? "/" : ""}`;
                          const isActive = child.type === "file" && child.name === fileName;
                          return (
                            <li class={`notes-doc-tree-child${isActive ? " is-active" : ""}`}>
                              <a href={childHref}>
                                {child.type === "directory" ? <FolderIcon /> : <FileIcon />}
                                <span>{child.name}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p class="notes-doc-tree-empty">No sections available</p>
          )}
        </nav>
      </aside>

      <article class="notes-doc-content">
        <nav class="notes-breadcrumb" aria-label="Breadcrumb">
          <a href="/notes/">NOTES</a>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const href = "/notes/" + segments.slice(0, i + 1).join("/") + (isLast ? "" : "/");
            return (
              <>
                <span class="notes-breadcrumb-sep" aria-hidden="true">/</span>
                {isLast ? (
                  <span class="notes-breadcrumb-current">{seg.toUpperCase()}</span>
                ) : (
                  <a href={href}>{seg.toUpperCase()}</a>
                )}
              </>
            );
          })}
        </nav>
        <h1 class="notes-doc-title">{title}</h1>
        <div class="notes-doc-body" dangerouslySetInnerHTML={{ __html: html }}></div>
      </article>

      <aside class="notes-doc-toc" aria-label="On this page">
        <div class="notes-doc-toc-header">ON THIS PAGE</div>
        {toc && toc.length > 0 ? (
          <ol class="notes-doc-toc-list">
            {toc.map((entry) => (
              <li class={`notes-doc-toc-item notes-doc-toc-level-${entry.level}`}>
                <a href={`#${entry.id}`}>{entry.text}</a>
              </li>
            ))}
          </ol>
        ) : (
          <p class="notes-doc-toc-empty">No sections</p>
        )}
      </aside>
    </div>
  );
};
