import { getNoteFromS3 } from "./index";
import { InvalidPath } from "./errors";
import { getWorkerPool, WorkerPoolError } from "./worker-pool";

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
