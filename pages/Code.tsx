import type { FC } from "hono/jsx";
import type { Project } from "../src/services/projects/index.ts";

type CodePageProps = {
  projects: Project[];
};

export const CodePage: FC<CodePageProps> = ({ projects }) => {
  return (
    <div class="code-page">
      <header class="code-header">
        <p class="code-eyebrow">Code</p>
        <h1 class="code-heading">Interactive Projects &amp; Experiments</h1>
      </header>

      <div class="code-grid">
        {projects.map((project) => (
          <article class="code-card">
            <a
              class="code-card-preview"
              href={project.path}
              aria-label={`Open ${project.displayName} demo`}
            >
              <iframe
                class="code-card-iframe"
                src={project.previewSrc}
                title={`${project.displayName} preview`}
                scrolling="no"
                loading="lazy"
                tabindex="-1"
                aria-hidden="true"
              ></iframe>
              {project.badge ? (
                <span class="code-card-badge">{project.badge}</span>
              ) : null}
            </a>

            <div class="code-card-body">
              <h2 class="code-card-title">{project.displayName}</h2>
              {project.description ? (
                <p class="code-card-desc">{project.description}</p>
              ) : null}
              {project.tags.length > 0 ? (
                <ul class="code-card-tags">
                  {project.tags.map((tag) => (
                    <li class="code-card-tag">{tag}</li>
                  ))}
                </ul>
              ) : null}
              <a class="code-card-open" href={project.path}>
                Open Demo <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
