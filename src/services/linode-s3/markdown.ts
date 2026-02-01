import { getNoteFromS3 } from "./index";
import { InvalidPath } from "./errors";

/**
 * Convert markdown content to HTML
 * @param markdown - markdown content as string
 * @returns HTML string
 */
export function markdownToHtml(markdown: string): string {
    // TODO: Implement actual markdown to HTML conversion
    return "<div><h1>Dummy HTML</h1><p>Markdown content will be rendered here.</p></div>";
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
