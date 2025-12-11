import type { FC } from "hono/jsx";
import type { Profile } from "../data/types.ts";

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

          <section class="resume-section">
            <h2 class="resume-section-title">Contact</h2>
            <div class="resume-contact">
              <button
                class="contact-btn"
                hx-post="/api/contact"
                hx-swap="outerHTML"
              >
                {profile.cta.buttonText}
              </button>
            </div>
          </section>

          <section class="resume-section">
            <h2 class="resume-section-title">Education</h2>
            <div class="resume-item">
              <span class="resume-degree">{profile.education.degree}</span>
              <span class="resume-school">{profile.education.university}</span>
            </div>
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

      <main class="resume-main">
        <section class="resume-section">
          <h2 class="resume-section-title">About</h2>
          <p class="resume-about">
            Born on {profile.birthdate}. Passionate about building innovative software solutions
            and exploring the intersection of technology and creativity.
          </p>
        </section>

        <section class="resume-section">
          <h2 class="resume-section-title">Areas of Expertise</h2>
          <div class="resume-skills">
            {profile.interests.map((interest) => (
              <div
                class="resume-skill"
                hx-get={`/api/interest/${interest.id}`}
                hx-trigger="click"
                hx-swap="innerHTML"
                hx-target="#skill-detail"
              >
                <span class="skill-icon">{interest.icon}</span>
                <div class="skill-content">
                  <h3 class="skill-title">{interest.title}</h3>
                  <p class="skill-desc">{interest.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div id="skill-detail" class="skill-detail"></div>
        </section>
      </main>
    </div>
  );
};
