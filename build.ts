import { Glob, $ } from "bun";
import { mkdir, cp, stat } from "fs/promises";
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

// Copy static assets (html, js, css, wasm) from projects-showcase to public
const assetGlob = new Glob("projects-showcase/**/*.{html,js,css,wasm}");
const copiedFiles: string[] = [];

for await (const file of assetGlob.scan(".")) {
  const destPath = join("public", file);
  const destDir = dirname(destPath);

  const dirExists = await stat(destDir).then(() => true).catch(() => false);
  if (!dirExists) await mkdir(destDir, { recursive: true });
  await cp(file, destPath, { force: true });
  copiedFiles.push(file);
}

if (copiedFiles.length > 0) {
  console.log(`\n✓ Copied ${copiedFiles.length} static file(s) to public/`);
  for (const file of copiedFiles) {
    console.log(`  - ${file} → public/${file}`);
  }
}
