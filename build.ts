import { Glob, $ } from "bun";
import { mkdir, cp, rm, stat } from "fs/promises";
import { dirname, join } from "path";

// Build Zig WASM
console.log("Building Zig WASM...");
await $`cd projects-showcase/boids/wasm && zig build`;
await cp("projects-showcase/boids/wasm/zig-out/bin/Boids.wasm", "projects-showcase/boids/boids.wasm");
console.log("✓ Built Zig WASM → projects-showcase/boids/boids.wasm");

// Build TypeScript client files
const entrypoints = new Glob("src/client/*.ts");

const results = await Bun.build({
  entrypoints: [...entrypoints.scanSync(".")],
  outdir: "./public/js",
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV === "production" ? "none" : "linked",
  target: "browser",
});

if (!results.success) {
  console.error("Build failed:");
  for (const log of results.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log(`✓ Built ${results.outputs.length} file(s) to public/js/`);
for (const output of results.outputs) {
  console.log(`  - ${output.path}`);
}

// Copy vendored htmx into public/js so we can serve /js/htmx.min.js locally
await cp("node_modules/htmx.org/dist/htmx.min.js", "public/js/htmx.min.js", { force: true });
console.log("✓ Copied htmx.min.js → public/js/htmx.min.js");

// Copy static assets from projects-showcase to public. Code assets ship from
// every project; images ship from everything except elo, which has its own
// curated `assets/` copy below (its `docs/` figures and `source-data/` flag
// dupes are dev artifacts the served pages never reference).
const codeAssetGlob = new Glob("projects-showcase/**/*.{html,js,css,wasm}");
const imageGlob = new Glob(
  "projects-showcase/**/*.{png,svg,jpg,jpeg,gif,webp}",
);
const copiedFiles: string[] = [];

const copyAsset = async (file: string) => {
  const destPath = join("public", file);
  const destDir = dirname(destPath);

  const dirExists = await stat(destDir).then(() => true).catch(() => false);
  if (!dirExists) await mkdir(destDir, { recursive: true });
  await cp(file, destPath, { force: true });
  copiedFiles.push(file);
};

for await (const file of codeAssetGlob.scan(".")) {
  await copyAsset(file);
}
for await (const file of imageGlob.scan(".")) {
  if (file.startsWith("projects-showcase/elo/")) continue;
  await copyAsset(file);
}

if (copiedFiles.length > 0) {
  console.log(`\n✓ Copied ${copiedFiles.length} static file(s) to public/`);
  for (const file of copiedFiles) {
    console.log(`  - ${file} → public/${file}`);
  }
}

// The elo predictor (elo/web) fetches data + flag SVGs from a sibling `assets`
// dir (../assets/*.json, ../assets/flags/*.svg). Those extensions aren't matched
// by the glob above, so copy the whole assets tree explicitly. Clear the
// destination first: a recursive cp onto an existing dir throws EEXIST under
// Bun 1.1 (the Docker build image), and public/ ships those files committed.
const eloAssetsSrc = "projects-showcase/elo/assets";
if (await stat(eloAssetsSrc).then(() => true).catch(() => false)) {
  const eloAssetsDest = "public/projects-showcase/elo/assets";
  await rm(eloAssetsDest, { recursive: true, force: true });
  await cp(eloAssetsSrc, eloAssetsDest, { recursive: true });
  console.log(`✓ Copied elo assets → ${eloAssetsDest}`);
}

// Build server-side TSX to JavaScript for production
console.log("\nBuilding server-side TSX...");

const serverResult = await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  minify: process.env.NODE_ENV === "production",
  sourcemap: "none",
  packages: "external",
  naming: "[name].js",
});

if (!serverResult.success) {
  console.error("Server build failed:");
  for (const log of serverResult.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log(`✓ Built server bundle to dist/`);
for (const output of serverResult.outputs) {
  console.log(`  - ${output.path}`);
}

// Copy service worker to public
await cp("workers/sw.js", "public/sw.js", { force: true });
console.log("\n✓ Copied service worker to public/sw.js");
