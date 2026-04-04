import type { FC } from "hono/jsx";
import type { Project } from "../src/services/projects/index.ts";

type CodePageProps = {
  projects: Project[];
};

export const CodePage: FC<CodePageProps> = ({ projects }) => {
  return (
    <div class="code-page">
      <div class="projects-grid">
        {projects.map((project) => (
          <a href={project.path} class="project-card">
            <div class="project-card-content">
              <h2 class="project-card-title">{project.displayName}</h2>
              <span class="project-card-arrow">&rarr;</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
