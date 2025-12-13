export {};

const init = () => {
  const navbar = document.querySelector(".navbar");
  const navbarTitle = document.querySelector(".nav-brand h1");
  const navbarSubtitle = document.querySelector(".nav-brand div.subtitle");
  const heroSection = document.querySelector(".resume-header");

  if (!navbarTitle || !heroSection) return;

  // Start hidden
  navbarTitle.classList.add("navbar-title-hidden");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Hero visible → hide navbar title, subtitle normal, navbar expanded
          navbarTitle.classList.add("navbar-title-hidden");
          navbarTitle.classList.remove("navbar-title-visible");
          navbarSubtitle?.classList.add("navbar-subtitle-shifted");
          navbar?.classList.add("navbar-compact");
        } else {
          // Hero not visible → show navbar title, shift subtitle up, navbar compact
          navbarTitle.classList.remove("navbar-title-hidden");
          navbarTitle.classList.add("navbar-title-visible");
          navbarSubtitle?.classList.remove("navbar-subtitle-shifted");
          navbar?.classList.remove("navbar-compact");
        }
      });
    },
    { threshold: 0, rootMargin: "-180px 0px 0px 0px"}
  );

  observer.observe(heroSection);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
