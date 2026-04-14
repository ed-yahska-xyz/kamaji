# kamaji

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
