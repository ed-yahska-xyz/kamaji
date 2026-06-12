# kamaji

## 0.7.2

### Patch Changes

- [#59](https://github.com/ed-yahska-xyz/kamaji/pull/59) [`9fb847f`](https://github.com/ed-yahska-xyz/kamaji/commit/9fb847ff9a5f84bae52e8cfc515fb51abc3c4432) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Diary grid: most recent week now renders first (leftmost), duplicate month labels are suppressed, and narrow screens get a vertical layout with left-aligned month labels and full-width day cells.

## 0.7.1

### Patch Changes

- [#57](https://github.com/ed-yahska-xyz/kamaji/pull/57) [`8c78ac2`](https://github.com/ed-yahska-xyz/kamaji/commit/8c78ac26cbeebd7c8584044bd7ed147b6bd9a6b1) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Fix the production image build failing on the elo predictor assets. The build copied the predictor's data/flag assets with a recursive directory copy, which throws `EEXIST` under the Bun version used in the Docker build when the destination already exists. The copy now clears the destination first, so the container image (and the World Cup predictor it ships) builds and deploys.

## 0.7.0

### Minor Changes

- [#55](https://github.com/ed-yahska-xyz/kamaji/pull/55) [`6694a7d`](https://github.com/ed-yahska-xyz/kamaji/commit/6694a7d27fdd020bac328c0886cee03a81bdd50e) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add the World Cup 2026 predictor to the projects showcase and redesign the `/code` page as a card gallery. Each project now appears as a brutalist card with a live preview, category badge, description, and tech tags. The predictor lets you make this-or-that picks between teams that feed a Bradley–Terry model and a Zig tournament engine to simulate the bracket.

## 0.6.0

### Minor Changes

- [#53](https://github.com/ed-yahska-xyz/kamaji/pull/53) [`05f9c74`](https://github.com/ed-yahska-xyz/kamaji/commit/05f9c746b6d2b4f786543f18c42205c66a229df3) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add a daily diary in place of the GitHub contributions heatmap. The home page now shows a clickable day grid where each day opens its own entry, you can write multiple paragraphs per day, and any `#hashtags` you use become searchable — including across multiple tags at once on the new search page. Sign-in is now more secure, with proper accounts and sessions.

## 0.5.0

### Minor Changes

- [#50](https://github.com/ed-yahska-xyz/kamaji/pull/50) [`9e50341`](https://github.com/ed-yahska-xyz/kamaji/commit/9e5034153b470ffe65130310a8874774958d95f7) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Redesign the home page as an editorial split. Left column holds the bio (`PORTFOLIO` eyebrow, AKSHAY SHINDE display name, role, intro copy, 7+ years / M.S. stats, and `Get In Touch` + `View Code` actions). Right column holds a black-bordered showcase frame around a randomly-selected live demo (Boids or Game of Life) with a corner `· LIVE` badge and an `Open in Code →` caption overlay. The GitHub contributions strip below switches from a vertical SVG month-grouped grid to a horizontal seven-row grid, with a `LESS / squares / MORE` legend, and becomes horizontally scrollable on narrow viewports. The cyan top bar keeps the "Engineering with Purpose, Creativity & a Lot of Fun" subtitle as the primary navbar mark on `/` and collapses to a block layout below 520px so the subtitle wraps cleanly. Boids showcase agent count is lowered from 2000 to 500 so the iframe doesn't compete with hero paint on mobile. Tagline corrected from "Ebay" to "eBay".

- [#50](https://github.com/ed-yahska-xyz/kamaji/pull/50) [`9e50341`](https://github.com/ed-yahska-xyz/kamaji/commit/9e5034153b470ffe65130310a8874774958d95f7) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Replace the full-width cyan navbar with a floating pill + adaptive navigation. A rounded cyan title pill ("Akshay Shinde · [subtitle]") floats top-left on every page. On tablet/desktop a small black hamburger button floats top-right and opens an anchored nav menu. On mobile (<768px) the hamburger is replaced by a bottom tab bar that mirrors the nav items — and if the item count grows past 4 the tab bar collapses to the first three primary items plus a `More` tab that opens a native `<dialog>`-based bottom sheet listing every section. Native focus trap, Esc-to-close, and backdrop-click-to-close come from the browser; the client module (`src/client/nav.ts`) is ~50 lines of vanilla DOM. Adds `data/nav.ts` as a single source of truth for nav items and active-route matching.

### Patch Changes

- [#51](https://github.com/ed-yahska-xyz/kamaji/pull/51) [`4fb6402`](https://github.com/ed-yahska-xyz/kamaji/commit/4fb64026457fa961b58346a71b6a741f0280c230) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Stop tracking `public/sw.js`. It's a build artifact — `build.ts` copies `workers/sw.js` → `public/sw.js` on every `bun run build`. Keeping it in git meant the committed copy could (and did) drift from the source whenever a PR updated `workers/sw.js` without re-running the build. Now matches how `public/js/` and `public/projects/` are already gitignored. Production Docker builds always run `bun run build` so the runtime image is unaffected.

## 0.4.1

### Patch Changes

- [#45](https://github.com/ed-yahska-xyz/kamaji/pull/45) [`cff126a`](https://github.com/ed-yahska-xyz/kamaji/commit/cff126a2a3491e6fec84333a4d7054f91a60de9a) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add `Cache-Control: public, max-age=300` to the `/api/github-contributions` response so browsers (and any reverse proxy / CDN) cache the response for 5 minutes. The home page fires the HTMX contributions request on every visit, and the upstream GraphQL roundtrip was the single largest server-side contributor to perceived home-page latency (~405ms uncached vs <1ms for everything else). Back/forward navigations and quick reloads now skip the request entirely.

- [#43](https://github.com/ed-yahska-xyz/kamaji/pull/43) [`ddc2f85`](https://github.com/ed-yahska-xyz/kamaji/commit/ddc2f85cec0e427f37ea1e62af3f092b4bc603b3) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Self-host htmx instead of loading from unpkg. Removes a render-blocking
  third-party request whose latency varied from ~100ms to a stall, and which
  blocked the home page from painting on flaky networks. The file is copied
  from `node_modules/htmx.org/dist/htmx.min.js` to `public/js/htmx.min.js`
  during `bun run build`, and the script tag in `Layout.tsx` now points at
  the local path with `defer`.

- [#48](https://github.com/ed-yahska-xyz/kamaji/pull/48) [`766bcdd`](https://github.com/ed-yahska-xyz/kamaji/commit/766bcddd668f3d7449076a58e55c6a233155e70a) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add Cache-Control headers to static assets served by Hono's serveStatic.
  Previously every reload re-downloaded CSS/JS/WASM in full. Now: built
  JS and styles.css cache for 1 hour with must-revalidate, WASM caches
  for 24 hours with must-revalidate, project-showcase HTML/JS/CSS caches
  for 1 hour, and /sw.js is no-cache (so service-worker updates always
  reach clients). Filenames aren't content-hashed yet, so we use
  must-revalidate rather than immutable.

- [#46](https://github.com/ed-yahska-xyz/kamaji/pull/46) [`9abf82b`](https://github.com/ed-yahska-xyz/kamaji/commit/9abf82b3e9077383a3b5a7f1acfff454b39ab482) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Fix stale service-worker caching that occasionally required two hard
  reloads to pick up redesigned pages. Bumps the notes cache name to
  v2 so old caches evict on activate, registers a visibilitychange
  handler that calls `registration.update()` when a tab returns to the
  foreground, and adds an inline invalidation playbook at the top of
  `workers/sw.js` so future bumps are obvious.

## 0.4.0

### Minor Changes

- [#39](https://github.com/ed-yahska-xyz/kamaji/pull/39) [`36d5f9b`](https://github.com/ed-yahska-xyz/kamaji/commit/36d5f9b08b24a8f55bf4d473ad3e70c37b32d212) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Redesign the Notes section as a three-pane docs view: a left-hand explorer listing all notes, a center reading pane, and a right-hand table-of-contents generated from the rendered markdown headings.

## 0.3.0

### Minor Changes

- [#35](https://github.com/ed-yahska-xyz/kamaji/pull/35) [`2242cde`](https://github.com/ed-yahska-xyz/kamaji/commit/2242cde76aafc005312bbe06d5e0fec58b647bc6) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add manually-triggered deploy workflow. SSHes into the Linode host, pulls the selected GHCR image tag, and runs docker compose up to swap the running container. Supports deploying any published release version (default: latest) via workflow_dispatch input for easy rollback.

## 0.2.4

### Patch Changes

- [#32](https://github.com/ed-yahska-xyz/kamaji/pull/32) [`6c1d523`](https://github.com/ed-yahska-xyz/kamaji/commit/6c1d523e6f71adecc1c5638b29cea1cc3cd9db6c) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Fix container build failing to find Dockerfile. Without an explicit context, docker/build-push-action was using the GitHub git context of the triggering repo instead of the local working directory where the virtuals repo was checked out. Added context: . to use the checked-out sparse-checkout.

## 0.2.3

### Patch Changes

- [#30](https://github.com/ed-yahska-xyz/kamaji/pull/30) [`61ba383`](https://github.com/ed-yahska-xyz/kamaji/commit/61ba383795b0ef34d996ff1774233e9e7156f669) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Fix container build failing with "no such file or directory" for kamaji/Dockerfile. The sparse-checkout was using cone mode (default), which only accepts directory paths. Changed to checkout the whole kamaji directory from the virtuals repo.

## 0.2.2

### Patch Changes

- [#28](https://github.com/ed-yahska-xyz/kamaji/pull/28) [`19b0bd3`](https://github.com/ed-yahska-xyz/kamaji/commit/19b0bd3f205502b3ee839dbe6ec3045f3de2deca) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Fix container build always being skipped on release. Use hasChangesets output instead of published (which is never true for private packages), with a version-changed guard to prevent false triggers on PRs without changesets.

## 0.2.1

### Patch Changes

- [#26](https://github.com/ed-yahska-xyz/kamaji/pull/26) [`bc54d12`](https://github.com/ed-yahska-xyz/kamaji/commit/bc54d125250318591af9344432e1507a2caf4fd6) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add Open Graph and Twitter Card meta tags to Layout for social media sharing previews. Home page uses og:type profile with structured profile metadata and link rel="me" for external profiles (LinkedIn).

## 0.2.0

### Minor Changes

- [#19](https://github.com/ed-yahska-xyz/kamaji/pull/19) [`bf56bd2`](https://github.com/ed-yahska-xyz/kamaji/commit/bf56bd2d9cad3ad5f35767a0fde2014317271066) Thanks [@ednihs-yahska](https://github.com/ednihs-yahska)! - Add semantic versioning and automatic changeset generation with GitHub Actions release workflow. Adding a workflow to check for changeset for each PR.
