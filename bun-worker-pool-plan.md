# Bun implementation plan — Option A.2 (worker pool + framing)

This plan is **explicitly aligned** with your current Zig implementation of
`ed-markdown-parser`, with the updated build output directory name:

- **`zig-out/` has been renamed to `md2html/`**

So the built binaries live under:

```text
md2html/bin/
```

Zig already provides:

- A **worker mode** binary:
  ```bash
  ./md2html/bin/md2html --worker
  ```
- A **length-prefixed framing protocol**:
  - Request: `<LEN>\n<LEN bytes of markdown>`
  - Response: `<LEN>\n<LEN bytes of html>`
- Sequential request handling per worker
- Clean exit on EOF
- Cross-compiled binaries for all major platforms

This plan focuses **only on the Bun-side architecture**.

---

## 1) Decide which Zig binary Bun should run

### Preferred (local dev / same machine)
Use the native binary produced by Zig:

```text
md2html/bin/md2html
```

Run with:
```bash
./md2html/bin/md2html --worker
```

### Cross-platform deployment
If deploying to multiple OS/architectures:

- Select the correct binary at startup:
  - `md2html-darwin-arm64`
  - `md2html-darwin-x64`
  - `md2html-linux-arm64`
  - `md2html-linux-x64`
  - `md2html-win32-arm64.exe`
  - `md2html-win32-x64.exe`
- These are expected at:
  ```text
  md2html/bin/
  ```
- Optionally select via env var:
  ```bash
  MD2HTML_BIN=./md2html/bin/md2html-linux-x64
  ```

### Bun invariant
Bun **never** calls:
- `zig run`
- `zig build run`

Bun only executes **prebuilt binaries** from `md2html/bin/`.

---

## 2) Worker process lifecycle (Bun mental model)

Each Zig worker is:
- a **long-lived child process**
- running `md2html --worker`
- communicating over **stdin/stdout**
- handling **exactly one request at a time**

```
HTTP Request
   ↓
WorkerPool
   ↓
Idle Zig worker
   ↓
(stdin/stdout framed protocol)
   ↓
HTML
```

Workers are:
- created at Bun startup
- reused across requests
- replaced if they crash or desync

---

## 3) Implement `ZigWorker` (one process + framed IO)

### Responsibilities
A `ZigWorker` abstraction must:

- spawn the Zig worker binary (from `md2html/bin/`)
- maintain an internal stdout buffer
- implement:
  ```ts
  render(markdown: string): Promise<string>
  ```
- enforce **no concurrent use**

### Why buffering is required
Node/Bun streams:
- deliver arbitrary chunks
- do not preserve message boundaries
- cannot “unread” bytes

So each worker maintains a **byte buffer** and provides:
- `readLine()` → reads until `\n`
- `readExact(n)` → reads exactly `n` bytes

### `render()` protocol (exact steps)
1. Encode markdown to UTF-8 bytes.
2. Write request frame:
   - `<len>\n`
   - `<markdown bytes>`
3. Read response frame:
   - read `<len>\n`
   - read `<html bytes>`
4. Decode HTML and return.

### Failure conditions
If any of the following occur:
- worker exits
- malformed length line
- EOF mid-frame
- timeout

Then:
- treat worker as dead
- reject the request
- respawn the worker

---

## 4) Implement `WorkerPool` (N workers + FIFO queue)

### Core invariants
- Each worker handles **only one request at a time**
- The pool enforces exclusivity via a `busy` flag
- Requests are queued FIFO

### Pool responsibilities
- spawn N workers at startup
- route requests to idle workers
- queue excess requests
- recover from worker crashes

### Pool size
Recommended starting point:
```ts
const WORKERS = Math.max(1, cpuCores - 1);
```

Guidance:
- Markdown parsing is CPU-bound
- More workers than cores rarely helps
- Leave at least one core for Bun + OS

---

## 5) Worker crash & recovery strategy

### When to respawn a worker
Respawn if:
- `proc.exited` resolves unexpectedly
- framed protocol desyncs
- `render()` throws

### Recovery steps
1. Kill the worker process (if still alive)
2. Remove it from the pool
3. Spawn a replacement
4. (Optional) retry the request once

### Retry policy
Recommended:
- Retry **once** for worker-level failures
- Do **not** retry for:
  - request size violations
  - validation failures

---

## 6) HTTP route integration

### Typical endpoint flow
```ts
POST /render
```

1. Read request body as text
2. Enforce max body size (e.g. 5MB)
3. `html = await pool.render(markdown)`
4. Return:
   - `200 text/html` on success
   - `500 application/json` on failure

### Size limits (important)
Apply limits **before** sending to Zig:
- protects workers
- avoids unnecessary framing work

---

## 7) Timeouts and stuck-worker handling

### Timeout strategy
Wrap each `render()` call:
- e.g. 2–5 seconds

If timeout fires:
- return error to client
- kill the busy worker
- respawn it

### Why kill on timeout
A stuck worker:
- blocks the pool
- is often unrecoverable
- should be replaced aggressively

---

## 8) Observability & diagnostics

### Logging
- Log worker spawn / respawn
- Log render latency
- Log queue depth under load

### Zig stderr
- Capture `stderr` output on worker failure
- Attach it to Bun logs (extremely useful for debugging parser bugs)

---

## 9) Testing strategy (Bun side)

### Functional tests
- Basic markdown (`# heading`)
- Empty input
- Large but valid markdown
- Unicode-heavy content

### Protocol robustness tests
- Markdown with many newlines
- Backticks, code blocks, binary-ish content
- Ensure no framing desync

### Concurrency tests
- Fire 100–1000 parallel requests
- Confirm:
  - no mixed outputs
  - stable latency
  - no worker leaks

---

## 10) Deployment notes

### Docker
- Copy Bun server
- Copy Zig binaries (`md2html/bin/*`)
- Select correct binary at runtime
- Ensure executable permissions

### Runtime invariant
- Bun is the **orchestrator**
- Zig workers are **pure compute engines**
- No shared state between workers

---

## Bun-side "done" checklist

- [x] Correct Zig worker binary selected per platform from `md2html/bin/`
- [x] `ZigWorker.render()` fully implements framing
- [x] `WorkerPool` enforces exclusivity
- [x] Worker crashes are detected and recovered
- [x] Size limits + timeouts enforced
- [x] Endpoint stable under concurrent load
