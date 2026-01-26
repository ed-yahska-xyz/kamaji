import { readdirSync, statSync } from "fs";
import { join } from "path";

export type Project = {
  name: string;
  displayName: string;
  path: string;
};

const PROJECTS_DIR = "./projects-showcase";

export function getProjects(): Project[] {
  const entries = readdirSync(PROJECTS_DIR);

  const projects = entries
    .filter((entry) => {
      const fullPath = join(PROJECTS_DIR, entry);
      return statSync(fullPath).isDirectory() && !entry.startsWith(".");
    })
    .map((dir) => ({
      name: dir,
      displayName: dir
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      path: `/projects-showcase/${dir}/index.html`,
    }));

  return projects;
}
