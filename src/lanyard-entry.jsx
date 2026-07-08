const DESKTOP_QUERY = "(min-width: 768px)";
const lanyardRoot = document.querySelector("[data-lanyard-root]");
let lanyardRootInstance = null;
let lanyardModulesPromise = null;

function loadLanyardModules() {
  lanyardModulesPromise ??= Promise.all([
    import("react"),
    import("react-dom/client"),
    import("./components/Lanyard.jsx"),
    import("./assets/lanyard/card-back.svg"),
    import("./assets/lanyard/card-front.svg"),
    import("./components/Lanyard.css"),
  ]);

  return lanyardModulesPromise;
}

async function mountLanyard(mediaQuery) {
  if (!(lanyardRoot instanceof HTMLElement) || lanyardRootInstance) {
    return;
  }

  const [{ createElement }, { createRoot }, { default: Lanyard }, { default: cardBack }, { default: cardFront }] =
    await loadLanyardModules();

  if (!mediaQuery.matches || lanyardRootInstance) {
    return;
  }

  lanyardRootInstance = createRoot(lanyardRoot);
  lanyardRootInstance.render(
    createElement(Lanyard, {
      position: [0, 0, 22],
      gravity: [0, -40, 0],
      fov: 15.6,
      frontImage: cardFront,
      backImage: cardBack,
      imageFit: "cover",
      lanyardWidth: 0.54,
      sceneOffset: [2.36, 1.12, 0],
    }),
  );
}

function unmountLanyard() {
  lanyardRootInstance?.unmount();
  lanyardRootInstance = null;
}

if (lanyardRoot instanceof HTMLElement) {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  const syncLanyard = () => {
    if (mediaQuery.matches) {
      void mountLanyard(mediaQuery);
      return;
    }

    unmountLanyard();
  };

  syncLanyard();
  mediaQuery.addEventListener("change", syncLanyard);
}
