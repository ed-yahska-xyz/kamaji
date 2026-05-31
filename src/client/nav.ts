export {};

function initHamburger() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-nav-menu]");
  if (!toggle || !menu) return;

  const open = () => {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hidden) open();
    else close();
  });

  document.addEventListener("click", (e) => {
    if (menu.hidden) return;
    const t = e.target as Node;
    if (!menu.contains(t) && !toggle.contains(t)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      close();
      toggle.focus();
    }
  });
}

function initBottomSheet() {
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  if (!sheet) return;

  const openers = document.querySelectorAll<HTMLButtonElement>("[data-sheet-open]");
  openers.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof sheet.showModal === "function") sheet.showModal();
      else sheet.setAttribute("open", "");
    });
  });

  const closers = sheet.querySelectorAll<HTMLButtonElement>("[data-sheet-close]");
  closers.forEach((btn) => {
    btn.addEventListener("click", () => sheet.close());
  });

  // Click on backdrop (the dialog element itself) closes the sheet.
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet) sheet.close();
  });
}

function init() {
  initHamburger();
  initBottomSheet();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
