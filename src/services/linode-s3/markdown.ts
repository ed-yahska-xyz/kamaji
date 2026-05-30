import { getNoteFromS3 } from "./index";
import { InvalidPath } from "./errors";
import { getWorkerPool, WorkerPoolError } from "./worker-pool";

export interface TocEntry {
    id: string;
    text: string;
    level: 2 | 3;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/<[^>]+>/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, "");
}

function extractIdAttr(attrs: string): string | null {
    const m = attrs.match(/\bid\s*=\s*"([^"]+)"/i);
    return m ? m[1]! : null;
}

/**
 * Walk rendered HTML, inject `id` attributes on h2/h3 headings (when missing),
 * and collect a table of contents for sidebar rendering.
 */
export function extractToc(html: string): { html: string; toc: TocEntry[] } {
    const toc: TocEntry[] = [];
    const seen = new Map<string, number>();

    const newHtml = html.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
        (_match, levelStr: string, rawAttrs: string, inner: string) => {
            const level = Number(levelStr) as 2 | 3;
            const text = stripTags(inner).trim();
            if (!text) return _match;

            let id = extractIdAttr(rawAttrs);
            let attrs = rawAttrs;

            if (!id) {
                const base = slugify(text) || `section-${toc.length + 1}`;
                const n = seen.get(base) ?? 0;
                seen.set(base, n + 1);
                id = n === 0 ? base : `${base}-${n}`;
                attrs = `${rawAttrs} id="${id}"`;
            }

            toc.push({ id, text, level });
            return `<h${level}${attrs}>${inner}</h${level}>`;
        }
    );

    return { html: newHtml, toc };
}

/**
 * Convert markdown content to HTML using the Zig worker pool
 * @param markdown - markdown content as string
 * @returns Promise<string> HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
    const pool = getWorkerPool();

    try {
        const html = await pool.render(markdown);
        return html;
    } catch (error) {
        console.error("[markdown] Failed to convert markdown:", error);

        // Return error message as HTML for graceful degradation
        if (error instanceof WorkerPoolError) {
            return `<div class="error"><h1>Markdown Rendering Error</h1><p>${error.message}</p></div>`;
        }

        throw error;
    }
}

/**
 * Fetch and return markdown file content from S3
 * @param path - path to the markdown file (without leading slash)
 * @returns markdown content as string
 * @throws InvalidPath if path is invalid
 */
export async function getMarkdownContent(path: string): Promise<string> {
    if (!path || !path.endsWith(".md")) {
        throw new InvalidPath("Path must be a valid markdown file");
    }

    console.log(`[markdown] LINODE_S3_READ_ONLY set: ${!!process.env.LINODE_S3_READ_ONLY}`);
    const content = await getNoteFromS3(path);
    console.log(`[markdown] Fetched content for: ${path}`);
    console.log(`[markdown] Content length: ${content.length} chars`);
    console.log(`[markdown] Preview: ${content.substring(0, 200)}...`);

    return content;
}
