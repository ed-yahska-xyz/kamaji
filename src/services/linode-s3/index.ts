import { InvalidPath } from "./errors";
import { readFileSync, existsSync } from "fs";

const CLUSTER_ID = process.env.LINODE_S3_CLUSTER_ID || "us-east-1";
const BUCKET_NAME = process.env.LINODE_S3_BUCKET_NAME || "notes";

// Docker secrets paths
const READ_WRITE_SECRET_PATH = "/run/secrets/linode_s3_read_write";
const READ_ONLY_SECRET_PATH = "/run/secrets/linode_s3_read_only";

// Read tokens from Docker secrets first, fallback to env vars
const LINODE_S3_READ_WRITE = existsSync(READ_WRITE_SECRET_PATH)
    ? readFileSync(READ_WRITE_SECRET_PATH, "utf8").trim()
    : process.env.LINODE_S3_READ_WRITE;

const LINODE_S3_READ_ONLY = existsSync(READ_ONLY_SECRET_PATH)
    ? readFileSync(READ_ONLY_SECRET_PATH, "utf8").trim()
    : process.env.LINODE_S3_READ_ONLY;

console.log(`[s3] Initialized with cluster: ${CLUSTER_ID}, bucket: ${BUCKET_NAME}`);

export interface S3Item {
    name: string;
    type: "directory" | "file";
    size?: number;
    lastModified?: string;
}

export interface S3ListResult {
    items: S3Item[];
    path: string;
}

// Linode API response types
interface LinodeObjectUrlResponse {
    url: string;
}

interface LinodeS3Object {
    name: string;
    size: number;
    last_modified: string;
    etag: string;
    owner: string;
}

interface LinodeObjectListResponse {
    data: LinodeS3Object[];
    prefixes?: string[];
    is_truncated: boolean;
    next_marker?: string;
}

/**
 * Get a note content from S3
 * @param path - path to the note file
 * @throws InvalidPath if path is empty
 */
export async function getNoteFromS3(path: string): Promise<string> {
    if (!path || path.length === 0) {
        throw new InvalidPath("Input path is invalid");
    }

    const token = LINODE_S3_READ_WRITE;
    const url = `https://api.linode.com/v4/object-storage/buckets/${CLUSTER_ID}/${BUCKET_NAME}/object-url`;

    console.log(`[s3] Requesting signed URL for: ${path}`);
    console.log(`[s3] API URL: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: path,
            method: 'GET',
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.log(`[s3] Error response: ${response.status} ${response.statusText}`);
        console.log(`[s3] Error body: ${errorBody}`);
        throw new Error(`Failed to get object URL: ${response.statusText}`);
    }

    const { url: signedUrl } = await response.json() as LinodeObjectUrlResponse;
    const contentResponse = await fetch(signedUrl);
    return contentResponse.text();
}

/**
 * List directories and files at a given path in S3
 * @param path - path prefix to list (use "/" or empty for root)
 * @returns S3ListResult with items array containing directories and files
 */
export async function getDirectoriesFromPath(path: string): Promise<S3ListResult> {
    const token = LINODE_S3_READ_ONLY;

    // Normalize path: treat "/" or empty as root
    let prefix = path === "/" ? "" : path;
    // Ensure prefix ends with "/" if not empty (to list contents of directory)
    if (prefix && !prefix.endsWith("/")) {
        prefix = prefix + "/";
    }

    const params = new URLSearchParams({
        delimiter: "/",
    });
    if (prefix) {
        params.set("prefix", prefix);
    }

    const url = `https://api.linode.com/v4/object-storage/buckets/${CLUSTER_ID}/${BUCKET_NAME}/object-list?${params}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to list objects: ${response.statusText}`);
    }

    const data = await response.json() as LinodeObjectListResponse;
    const items: S3Item[] = [];

    // Add directories (prefixes)
    if (data.prefixes) {
        for (const dirPath of data.prefixes) {
            // Remove trailing slash and get just the directory name
            const name = dirPath.replace(/\/$/, "").split("/").pop() || dirPath;
            items.push({
                name,
                type: "directory",
            });
        }
    }

    // Add files and directory markers from data array
    if (data.data) {
        for (const obj of data.data) {
            // Skip if this is the current directory marker itself
            if (obj.name === prefix) continue;

            // Check if this is a directory (ends with /)
            const isDirectory = obj.name.endsWith("/");

            // Get just the name without the prefix
            const rawName = obj.name.replace(prefix, "");
            // For directories, remove trailing slash then get last segment
            // For files, just get the filename
            const name = isDirectory
                ? rawName.replace(/\/$/, "").split("/").pop() || rawName
                : rawName.split("/").pop() || rawName;
            if (!name) continue;

            items.push({
                name,
                type: isDirectory ? "directory" : "file",
                size: isDirectory ? undefined : obj.size,
                lastModified: obj.last_modified,
            });
        }
    }
    return {
        items,
        path: path || "/",
    };
}

export default {
    services: {
        getNoteFromS3,
        getDirectoriesFromPath
    },
    errors: {
        InvalidPath
    }
}