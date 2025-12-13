import type { FC } from "hono/jsx";
import type { Profile } from "../data/types.ts";
import { ContributionsView } from "../components/Contributions.tsx";

type HomePageProps = {
  profile: Profile;
};

export const HomePage: FC<HomePageProps> = ({ profile }) => {
  return (
    <div class="resume-layout">
      <aside class="resume-sidebar">
        <div class="resume-card">
          <header class="resume-header">
            <h1 class="resume-name">{profile.name}</h1>
            <p class="resume-tagline">{profile.tagline}</p>
          </header>
          <section hx-get="/api/github-contributions" hx-trigger="load" hx-swap="outerHTML">
            <ContributionsView weeks={[]}/>
          </section>
          <section class="resume-section">
            <h2 class="resume-section-title">Contact</h2>
            <div class="resume-contact">
              <button
                class="contact-btn"
                hx-get="/api/contact"
                hx-target="body"
                hx-swap="beforeend"
              >
                {profile.cta.buttonText}
              </button>
            </div>
          </section>

          <section class="resume-section">
            <h2 class="resume-section-title">Education</h2>
            {profile.education.map((edu) => (
              <div class="resume-item">
                <span class="resume-degree">{edu.degree}</span>
                <span class="resume-school">{edu.university}</span>
              </div>
            ))}
          </section>

          <section class="resume-section">
            <h2 class="resume-section-title">Stats</h2>
            <div class="resume-stats">
              {profile.stats.map((stat) => (
                <div class="resume-stat">
                  <span class="resume-stat-value">{stat.value}</span>
                  <span class="resume-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
