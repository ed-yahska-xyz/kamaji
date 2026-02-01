import type { Subprocess } from "bun";
import path from "path";
import os from "os";

// ============================================================================
// Custom Error Types
// ============================================================================

export class WorkerPoolError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WorkerPoolError";
    }
}

export class WorkerProcessError extends WorkerPoolError {
    constructor(message: string) {
        super(message);
        this.name = "WorkerProcessError";
    }
}

export class FramingProtocolError extends WorkerPoolError {
    constructor(message: string) {
        super(message);
        this.name = "FramingProtocolError";
    }
}

export class RenderTimeout extends WorkerPoolError {
    constructor(message: string) {
        super(message);
        this.name = "RenderTimeout";
    }
}

// ============================================================================
// Platform Detection & Binary Selection
// ============================================================================

function getBinaryPath(): string {
    const platform = process.platform;
    const arch = process.arch;

    // Allow override via environment variable
    if (process.env.MD2HTML_BIN) {
        return process.env.MD2HTML_BIN;
    }

    // Map to binary name
    let binaryName = "md2html";

    if (platform === "darwin") {
        binaryName = arch === "arm64" ? "md2html-darwin-arm64" : "md2html-darwin-x64";
    } else if (platform === "linux") {
        binaryName = arch === "arm64" ? "md2html-linux-arm64" : "md2html-linux-x64";
    } else if (platform === "win32") {
        binaryName = arch === "arm64" ? "md2html-win32-arm64.exe" : "md2html-win32-x64.exe";
    }

    // Binary location relative to project root
    return path.join(process.cwd(), "md2html", "bin", binaryName);
}

// ============================================================================
// ZigWorker - Single process + framed IO
// ============================================================================

interface PendingRequest {
    resolve: (html: string) => void;
    reject: (error: Error) => void;
}

class ZigWorker {
    private proc: Subprocess<"pipe", "pipe", "pipe"> | null = null;
    private buffer: Uint8Array = new Uint8Array(0);
    private busy: boolean = false;
    private dead: boolean = false;
    private pendingRequest: PendingRequest | null = null;
    private stderr: string[] = [];
    private id: number;
    private static nextId = 0;

    constructor() {
        this.id = ZigWorker.nextId++;
    }

    /**
     * Spawn the Zig worker process
     */
    async spawn(): Promise<void> {
        const binaryPath = getBinaryPath();

        console.log(`[worker ${this.id}] Spawning: ${binaryPath} --worker`);

        this.proc = Bun.spawn([binaryPath, "--worker"], {
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
        });

        this.dead = false;
        this.buffer = new Uint8Array(0);
        this.stderr = [];

        // Capture stderr for debugging
        this.readStderr();

        // Monitor for unexpected exit
        this.proc.exited.then((exitCode) => {
            console.log(`[worker ${this.id}] Exited with code ${exitCode}`);
            this.dead = true;
            if (this.pendingRequest) {
                this.pendingRequest.reject(
                    new WorkerProcessError(`Worker exited unexpectedly with code ${exitCode}. stderr: ${this.stderr.join("")}`)
                );
                this.pendingRequest = null;
            }
        });
    }

    /**
     * Read stderr in background for debugging
     */
    private async readStderr(): Promise<void> {
        if (!this.proc?.stderr) return;

        const reader = this.proc.stderr.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    this.stderr.push(decoder.decode(value));
                }
            }
        } catch {
            // Process ended
        }
    }

    /**
     * Check if worker is available for a new request
     */
    isAvailable(): boolean {
        return !this.busy && !this.dead && this.proc !== null;
    }

    /**
     * Check if worker is dead and needs respawning
     */
    isDead(): boolean {
        return this.dead;
    }

    /**
     * Render markdown to HTML using the framing protocol
     */
    async render(markdown: string): Promise<string> {
        if (this.busy) {
            throw new WorkerPoolError("Worker is busy");
        }
        if (this.dead || !this.proc) {
            throw new WorkerProcessError("Worker is dead");
        }

        this.busy = true;

        try {
            // Encode markdown to UTF-8
            const encoder = new TextEncoder();
            const markdownBytes = encoder.encode(markdown);
            const len = markdownBytes.length;

            // Write request frame: <len>\n<markdown bytes>
            const lenLine = `${len}\n`;
            const lenBytes = encoder.encode(lenLine);

            this.proc.stdin.write(lenBytes);
            this.proc.stdin.write(markdownBytes);
            await this.proc.stdin.flush();

            // Read response frame
            const html = await this.readResponse();
            return html;
        } finally {
            this.busy = false;
        }
    }

    /**
     * Read response from worker using the framing protocol
     */
    private async readResponse(): Promise<string> {
        if (!this.proc?.stdout) {
            throw new WorkerProcessError("Worker stdout not available");
        }

        // Read the length line
        const lenLine = await this.readLine();
        const len = parseInt(lenLine, 10);

        if (isNaN(len) || len < 0) {
            this.dead = true;
            throw new FramingProtocolError(`Invalid length line: "${lenLine}"`);
        }

        // Read exactly len bytes
        const htmlBytes = await this.readExact(len);
        const decoder = new TextDecoder();
        return decoder.decode(htmlBytes);
    }

    /**
     * Read until newline from stdout (with buffering)
     */
    private async readLine(): Promise<string> {
        const decoder = new TextDecoder();

        while (true) {
            // Check buffer for newline
            const newlineIdx = this.buffer.indexOf(10); // '\n'
            if (newlineIdx !== -1) {
                const line = decoder.decode(this.buffer.slice(0, newlineIdx));
                this.buffer = this.buffer.slice(newlineIdx + 1);
                return line;
            }

            // Read more from stdout
            const chunk = await this.readChunk();
            if (chunk === null) {
                this.dead = true;
                throw new WorkerProcessError("EOF while reading line");
            }
        }
    }

    /**
     * Read exactly n bytes from stdout (with buffering)
     */
    private async readExact(n: number): Promise<Uint8Array> {
        while (this.buffer.length < n) {
            const chunk = await this.readChunk();
            if (chunk === null) {
                this.dead = true;
                throw new WorkerProcessError(`EOF while reading ${n} bytes, got ${this.buffer.length}`);
            }
        }

        const result = this.buffer.slice(0, n);
        this.buffer = this.buffer.slice(n);
        return result;
    }

    /**
     * Read a chunk from stdout and append to buffer
     */
    private async readChunk(): Promise<Uint8Array | null> {
        if (!this.proc?.stdout) {
            return null;
        }

        const reader = this.proc.stdout.getReader();
        try {
            const { done, value } = await reader.read();
            if (done || !value) {
                return null;
            }

            // Append to buffer
            const newBuffer = new Uint8Array(this.buffer.length + value.length);
            newBuffer.set(this.buffer);
            newBuffer.set(value, this.buffer.length);
            this.buffer = newBuffer;

            return value;
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Kill the worker process
     */
    kill(): void {
        if (this.proc && !this.dead) {
            console.log(`[worker ${this.id}] Killing`);
            this.proc.kill();
            this.dead = true;
        }
    }

    getId(): number {
        return this.id;
    }
}

// ============================================================================
// WorkerPool - N workers + FIFO queue
// ============================================================================

interface QueuedRequest {
    markdown: string;
    resolve: (html: string) => void;
    reject: (error: Error) => void;
}

export class WorkerPool {
    private workers: ZigWorker[] = [];
    private queue: QueuedRequest[] = [];
    private poolSize: number;
    private timeout: number;
    private maxBodySize: number;
    private initialized: boolean = false;

    constructor(options?: {
        poolSize?: number;
        timeout?: number;
        maxBodySize?: number;
    }) {
        const cpuCores = os.cpus().length;
        this.poolSize = options?.poolSize ?? Math.max(1, cpuCores - 1);
        this.timeout = options?.timeout ?? 5000; // 5 seconds default
        this.maxBodySize = options?.maxBodySize ?? 5 * 1024 * 1024; // 5MB default

        console.log(`[pool] Configuration: poolSize=${this.poolSize}, timeout=${this.timeout}ms, maxBodySize=${this.maxBodySize}`);
    }

    /**
     * Initialize the worker pool by spawning workers
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log(`[pool] Initializing ${this.poolSize} workers`);

        const spawnPromises = [];
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new ZigWorker();
            this.workers.push(worker);
            spawnPromises.push(worker.spawn());
        }

        await Promise.all(spawnPromises);
        this.initialized = true;

        console.log(`[pool] Initialized ${this.poolSize} workers`);
    }

    /**
     * Render markdown to HTML
     */
    async render(markdown: string): Promise<string> {
        // Ensure pool is initialized
        if (!this.initialized) {
            await this.initialize();
        }

        // Enforce size limit before sending to worker
        const encoder = new TextEncoder();
        const size = encoder.encode(markdown).length;
        if (size > this.maxBodySize) {
            throw new WorkerPoolError(`Markdown size ${size} exceeds max ${this.maxBodySize}`);
        }

        return new Promise((resolve, reject) => {
            this.queue.push({ markdown, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process queued requests
     */
    private async processQueue(): Promise<void> {
        if (this.queue.length === 0) return;

        // Find an available worker
        let worker = this.workers.find((w) => w.isAvailable());

        // Respawn dead workers
        for (let i = 0; i < this.workers.length; i++) {
            if (this.workers[i].isDead()) {
                console.log(`[pool] Respawning dead worker ${this.workers[i].getId()}`);
                const newWorker = new ZigWorker();
                await newWorker.spawn();
                this.workers[i] = newWorker;

                // Use this worker if we don't have one yet
                if (!worker) {
                    worker = newWorker;
                }
            }
        }

        if (!worker) {
            // All workers busy, request stays queued
            return;
        }

        const request = this.queue.shift();
        if (!request) return;

        this.executeRequest(worker, request);
    }

    /**
     * Execute a request on a worker with timeout
     */
    private async executeRequest(worker: ZigWorker, request: QueuedRequest): Promise<void> {
        const { markdown, resolve, reject } = request;

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let completed = false;

        const timeoutPromise = new Promise<never>((_, timeoutReject) => {
            timeoutId = setTimeout(() => {
                if (!completed) {
                    console.log(`[pool] Worker ${worker.getId()} timed out`);
                    worker.kill();
                    timeoutReject(new RenderTimeout(`Render timed out after ${this.timeout}ms`));
                }
            }, this.timeout);
        });

        try {
            const html = await Promise.race([
                worker.render(markdown),
                timeoutPromise,
            ]);

            completed = true;
            if (timeoutId) clearTimeout(timeoutId);
            resolve(html);
        } catch (error) {
            completed = true;
            if (timeoutId) clearTimeout(timeoutId);

            // If worker died, try to respawn and retry once
            if (error instanceof WorkerProcessError || error instanceof RenderTimeout) {
                console.log(`[pool] Worker failure, attempting retry`);

                // Respawn the worker
                const newWorker = new ZigWorker();
                await newWorker.spawn();
                const idx = this.workers.indexOf(worker);
                if (idx !== -1) {
                    this.workers[idx] = newWorker;
                }

                // Retry once
                try {
                    const html = await newWorker.render(markdown);
                    resolve(html);
                    return;
                } catch (retryError) {
                    reject(retryError as Error);
                    return;
                }
            }

            reject(error as Error);
        } finally {
            // Process next queued request
            this.processQueue();
        }
    }

    /**
     * Shutdown all workers
     */
    shutdown(): void {
        console.log(`[pool] Shutting down ${this.workers.length} workers`);
        for (const worker of this.workers) {
            worker.kill();
        }
        this.workers = [];
        this.initialized = false;
    }

    /**
     * Get pool statistics
     */
    getStats(): {
        poolSize: number;
        activeWorkers: number;
        queueDepth: number;
    } {
        return {
            poolSize: this.poolSize,
            activeWorkers: this.workers.filter((w) => w.isAvailable()).length,
            queueDepth: this.queue.length,
        };
    }
}

// ============================================================================
// Singleton Pool Instance
// ============================================================================

let poolInstance: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
    if (!poolInstance) {
        poolInstance = new WorkerPool();
    }
    return poolInstance;
}

export function shutdownWorkerPool(): void {
    if (poolInstance) {
        poolInstance.shutdown();
        poolInstance = null;
    }
}
