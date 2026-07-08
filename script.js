const root = document.documentElement;
const body = document.body;
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const themeChoices = [...document.querySelectorAll("[data-theme-choice]")];
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const navLinks = [...document.querySelectorAll(".side-nav__links a")];
const copyEmailButton = document.querySelector("[data-copy-email]");
const themeOrder = ["system", "light", "dark"];
const storageKey = "portfolio-theme";
const storedTheme = readStoredTheme();
const preferredTheme = themeOrder.includes(storedTheme || "") ? storedTheme : "system";
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

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
  root.dataset.theme = selectedTheme;
  root.dataset.resolvedTheme = resolvedTheme;
  writeStoredTheme(selectedTheme);

  themeChoices.forEach((choice) => {
    if (choice instanceof HTMLButtonElement) {
      const isActive = choice.dataset.themeChoice === selectedTheme;
      choice.classList.toggle("is-active", isActive);
      choice.setAttribute("aria-pressed", String(isActive));
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

  revealItems.forEach((item, index) => {
    if (item instanceof HTMLElement) {
      item.style.transitionDelay = `${Math.min(330, 50 + index * 70)}ms`;
    }

    revealObserver.observe(item);
  });

  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
          return;
        }

        const activeLink = navLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
      });
    },
    { rootMargin: "-34% 0px -56% 0px", threshold: 0.01 },
  );

  document.querySelectorAll("main[id], main section[id]").forEach((section) => {
    activeObserver.observe(section);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
