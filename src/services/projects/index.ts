import { readdirSync, statSync } from "fs";
import { join } from "path";

export type Project = {
  name: string;
  displayName: string;
  /** Full-page demo URL — the "Open Demo" link and preview target. */
  path: string;
  /** URL embedded in the card's live preview iframe. */
  previewSrc: string;
  /** Short category label shown over the preview. */
  badge: string;
  description: string;
  tags: string[];
};

const PROJECTS_DIR = "./public/projects-showcase";

// Per-project card metadata. Auto-detection still surfaces any directory under
// public/projects-showcase; entries here just give known demos a richer card
// (entry point, preview, blurb, tech tags). Anything missing falls back below.
type ProjectMeta = {
  displayName?: string;
  path?: string;
  previewSrc?: string;
  badge?: string;
  description?: string;
  tags?: string[];
};

const META: Record<string, ProjectMeta> = {
  boids: {
    badge: "Reynolds Flocking",
    description:
      "Emergent flocking from three local rules — separation, alignment, cohesion — running in WebAssembly.",
    tags: ["Zig", "WASM", "Canvas"],
    previewSrc: "/projects-showcase/boids/index.html?maxSpeed=3&noOfBoids=500",
  },
  "game-of-life": {
    badge: "Cellular Automaton",
    description:
      "Conway's classic automaton — four rules that produce gliders, oscillators, and chaos on a toroidal grid.",
    tags: ["Zig", "WASM", "Canvas"],
  },
  elo: {
    displayName: "World Cup Predictor",
    path: "/projects-showcase/elo/web/index.html",
    badge: "Tournament Sim",
    description:
      "World Cup 2026 — pairwise this-or-that picks feed a Bradley–Terry model and a Zig engine that simulates the bracket.",
    tags: ["Zig", "WASM"],
  },
};

function titleCase(dir: string): string {
  return dir
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getProjects(): Project[] {
  const entries = readdirSync(PROJECTS_DIR);

  return entries
    .filter((entry) => {
      const fullPath = join(PROJECTS_DIR, entry);
      return statSync(fullPath).isDirectory() && !entry.startsWith(".");
    })
    .map((dir) => {
      const meta = META[dir] ?? {};
      const path = meta.path ?? `/projects-showcase/${dir}/index.html`;
      return {
        name: dir,
        displayName: meta.displayName ?? titleCase(dir),
        path,
        previewSrc: meta.previewSrc ?? path,
        badge: meta.badge ?? "Live Demo",
        description: meta.description ?? "",
        tags: meta.tags ?? [],
      };
    });
}
