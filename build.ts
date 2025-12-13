import { Glob } from "bun";

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
