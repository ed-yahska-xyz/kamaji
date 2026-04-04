import type { FC } from "hono/jsx";
import type { Project } from "../src/services/projects/index.ts";

type CodePageProps = {
  projects: Project[];
};

export const CodePage: FC<CodePageProps> = ({ projects }) => {
  return (
    <div class="code-page">
      <ul class="list-view">
        {projects.map((project) => (
          <li class="list-item">
            <a href={project.path} class="list-item-link">
              <span class="list-item-title">{project.displayName}</span>
              <span class="list-item-arrow">&rarr;</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
