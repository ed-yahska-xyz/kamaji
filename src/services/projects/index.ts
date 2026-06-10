import { readdirSync, statSync } from "fs";
import { join } from "path";

export type Project = {
  name: string;
  displayName: string;
  path: string;
};

const PROJECTS_DIR = "./public/projects-showcase";

// Most demos serve from `<dir>/index.html`. A few live in a subdirectory or want
// a friendlier label than the title-cased directory name — override them here.
const ENTRY_OVERRIDES: Record<string, string> = {
  elo: "/projects-showcase/elo/web/index.html",
};
const DISPLAY_OVERRIDES: Record<string, string> = {
  elo: "World Cup Predictor",
};

export function getProjects(): Project[] {
  const entries = readdirSync(PROJECTS_DIR);

  const projects = entries
    .filter((entry) => {
      const fullPath = join(PROJECTS_DIR, entry);
      return statSync(fullPath).isDirectory() && !entry.startsWith(".");
    })
    .map((dir) => ({
      name: dir,
      displayName:
        DISPLAY_OVERRIDES[dir] ??
        dir
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      path: ENTRY_OVERRIDES[dir] ?? `/projects-showcase/${dir}/index.html`,
    }));

  return projects;
}
