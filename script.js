const root = document.documentElement;
const body = document.body;
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const themeChoices = [...document.querySelectorAll("[data-theme-choice]")];
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const sideNavLinkList = document.querySelector(".side-nav__links");
const navLinks = [...document.querySelectorAll(".side-nav__links a")];
const navSections = navLinks
  .map((link) => link.getAttribute("href") || "")
  .filter((href) => href.startsWith("#") && href !== "#top")
  .map((href) => document.getElementById(href.slice(1)))
  .filter((section) => section instanceof HTMLElement);
const workCards = [...document.querySelectorAll(".work-card")];
const copyEmailButton = document.querySelector("[data-copy-email]");
const themeOrder = ["system", "light", "dark"];
const storageKey = "portfolio-theme";
const storedTheme = readStoredTheme();
const preferredTheme = themeOrder.includes(storedTheme || "") ? storedTheme : "system";
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const finePointerQuery = window.matchMedia("(pointer: fine)");
let activeNavFrame = 0;

function readStoredTheme() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    return;
  }
}

function getSystemTheme() {
  return systemThemeQuery.matches ? "dark" : "light";
}

function applyTheme(theme) {
  const selectedTheme = themeOrder.includes(theme) ? theme : "system";
  const resolvedTheme = selectedTheme === "system" ? getSystemTheme() : selectedTheme;
  const themeIndex = Math.max(0, themeOrder.indexOf(selectedTheme));
  root.dataset.theme = selectedTheme;
  root.dataset.resolvedTheme = resolvedTheme;
  writeStoredTheme(selectedTheme);

  document.querySelectorAll(".theme-picker").forEach((picker) => {
    if (picker instanceof HTMLElement) {
      picker.style.setProperty("--theme-index", String(themeIndex));
    }
  });

  themeChoices.forEach((choice) => {
    if (choice instanceof HTMLButtonElement) {
      const isActive = choice.dataset.themeChoice === selectedTheme;
      choice.classList.toggle("is-active", isActive);
      choice.setAttribute("aria-pressed", String(isActive));
    }
  });
}

function updateSideNavIndicator(activeLink) {
  if (!(sideNavLinkList instanceof HTMLElement) || !(activeLink instanceof HTMLElement)) {
    return;
  }

  const listRect = sideNavLinkList.getBoundingClientRect();
  const activeRect = activeLink.getBoundingClientRect();
  const activeY = activeRect.top - listRect.top + activeRect.height / 2;
  sideNavLinkList.style.setProperty("--active-indicator-y", `${activeY}px`);
  sideNavLinkList.classList.add("has-active-indicator");
}

function setActiveNavLink(activeLink) {
  navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
  updateSideNavIndicator(activeLink);
}

function getDocumentHeight() {
  return Math.max(body.scrollHeight, root.scrollHeight, body.offsetHeight, root.offsetHeight);
}

function getNavLinkByHref(href) {
  return navLinks.find((link) => link.getAttribute("href") === href);
}

function resolveActiveNavLink() {
  const topLink = getNavLinkByHref("#top") || navLinks[0];
  const contactLink = getNavLinkByHref("#contact") || navLinks[navLinks.length - 1];

  if (window.scrollY <= 80) {
    return topLink;
  }

  if (window.scrollY >= getDocumentHeight() - window.innerHeight - 32) {
    return contactLink;
  }

  const activationY = Math.min(Math.max(window.innerHeight * 0.18, 120), 180);
  let activeSection = null;

  navSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationY) {
      activeSection = section;
    }
  });

  if (!(activeSection instanceof HTMLElement)) {
    return topLink;
  }

  return getNavLinkByHref(`#${activeSection.id}`) || topLink;
}

function syncActiveNavLink() {
  setActiveNavLink(resolveActiveNavLink());
  activeNavFrame = 0;
}

function queueActiveNavSync() {
  if (activeNavFrame) {
    return;
  }

  activeNavFrame = window.requestAnimationFrame(syncActiveNavLink);
}

function syncWorkCardCursor(card, event) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const rect = card.getBoundingClientRect();
  const cursorX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  const cursorY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  card.style.setProperty("--cursor-x", `${cursorX}px`);
  card.style.setProperty("--cursor-y", `${cursorY}px`);
}

function removeWorkCardCursorState() {
  workCards.forEach((card) => {
    if (card instanceof HTMLElement) {
      card.classList.remove("is-cursor-active");
    }
  });
}

function setMenuState(isOpen) {
  if (!(menu instanceof HTMLElement) || !(menuToggle instanceof HTMLButtonElement)) {
    return;
  }

  menu.classList.toggle("is-open", isOpen);
  body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

applyTheme(preferredTheme || "system");
syncActiveNavLink();

themeChoices.forEach((themeChoice) => {
  if (!(themeChoice instanceof HTMLButtonElement)) {
    return;
  }

  themeChoice.addEventListener("click", () => {
    applyTheme(themeChoice.dataset.themeChoice || "system");
  });
});

systemThemeQuery.addEventListener("change", () => {
  if (root.dataset.theme === "system") {
    applyTheme("system");
  }
});

if (menuToggle instanceof HTMLButtonElement) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });
}

document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

if (copyEmailButton instanceof HTMLButtonElement) {
  copyEmailButton.addEventListener("click", async () => {
    const value = copyEmailButton.dataset.copyValue || "";
    const previousLabel = copyEmailButton.textContent || "copy";

    try {
      await navigator.clipboard.writeText(value);
      copyEmailButton.textContent = "copied";
    } catch {
      copyEmailButton.textContent = "copy failed";
    }

    window.setTimeout(() => {
      copyEmailButton.textContent = previousLabel;
    }, 1400);
  });
}

workCards.forEach((card) => {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  card.addEventListener("pointerenter", (event) => {
    if (!finePointerQuery.matches) {
      return;
    }

    syncWorkCardCursor(card, event);
    card.classList.add("is-cursor-active");
  });

  card.addEventListener("pointermove", (event) => {
    if (finePointerQuery.matches) {
      syncWorkCardCursor(card, event);
    }
  });

  card.addEventListener("pointerleave", () => {
    card.classList.remove("is-cursor-active");
  });
});

finePointerQuery.addEventListener("change", removeWorkCardCursorState);

window.addEventListener("scroll", queueActiveNavSync, { passive: true });
window.addEventListener("resize", queueActiveNavSync);
window.addEventListener("load", syncActiveNavLink);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));

} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
