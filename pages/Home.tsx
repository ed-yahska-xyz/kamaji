import type { FC } from "hono/jsx";
import type { Profile } from "../data/types.ts";
import { ContributionsView } from "../components/Contributions.tsx";

type HomePageProps = {
  profile: Profile;
};

const possibleRandomProjects = [
  {
    src: "/projects-showcase/boids/index.html?maxSpeed=3&noOfBoids=2000",
    label: "Boids · Live",
    caption: "2000 agents, Reynolds flocking — written in Zig.",
    title: "Boids simulation — 2000 agents, written in Zig",
  },
  {
    src: "/projects-showcase/game-of-life/index.html",
    label: "Game of Life · Live",
    caption: "Conway's Game of Life — cellular automata in WebAssembly.",
    title: "Conway's Game of Life — cellular automata",
  },
];

export const HomePage: FC<HomePageProps> = ({ profile }) => {
  const [firstName, ...rest] = profile.name.split(" ");
  const lastName = rest.join(" ");
  const yearsStat = profile.stats[0];
  const eduStat = profile.stats[1];
  const showcase = possibleRandomProjects[
    Math.floor(Math.random() * possibleRandomProjects.length)
  ] ?? possibleRandomProjects[0]!;

  return (
    <div class="home">
      <section class="home-hero">
        <div class="home-bio">
          <p class="home-eyebrow">Portfolio</p>
          <h1 class="home-name">
            <span>{firstName}</span>
            <span>{lastName}</span>
          </h1>
          <p class="home-role">{profile.tagline}</p>
          <p class="home-description">
            MS Computer Science (Oregon State). I build for the front end, AI,
            and computer graphics — and tinker with low-level simulations in Zig.
          </p>
          <dl class="home-stats">
            <div class="home-stat">
              <dt class="home-stat-value">{yearsStat?.value}</dt>
              <dd class="home-stat-label">{yearsStat?.label}</dd>
            </div>
            <div class="home-stat">
              <dt class="home-stat-value">{eduStat?.value}</dt>
              <dd class="home-stat-label">{eduStat?.label}</dd>
            </div>
          </dl>
          <div class="home-actions">
            <button
              class="btn btn-primary"
              hx-get="/api/contact"
              hx-target="body"
              hx-swap="beforeend"
            >
              {profile.cta.buttonText}
            </button>
            <a href="/code" class="btn btn-secondary">
              View Code <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <aside class="home-showcase" aria-label="Live project demo">
          <div class="showcase-frame">
            <span class="showcase-badge">
              <span class="showcase-dot" aria-hidden="true"></span>
              {showcase.label}
            </span>
            <iframe
              class="showcase-iframe"
              scrolling="no"
              src={showcase.src}
              title={showcase.title}
              loading="lazy"
            ></iframe>
            <a class="showcase-caption" href="/code">
              <span>{showcase.caption}</span>
              <strong>Open in Code →</strong>
            </a>
          </div>
        </aside>
      </section>
      <section
        class="home-contributions"
        hx-get="/api/github-contributions"
        hx-trigger="load"
        hx-swap="outerHTML"
      >
        <ContributionsView weeks={[]} />
      </section>
    </div>
  );
};
