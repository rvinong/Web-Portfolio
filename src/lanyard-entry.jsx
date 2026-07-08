import { createRoot } from "react-dom/client";
import Lanyard from "./components/Lanyard.jsx";
import "./components/Lanyard.css";
import cardBack from "./assets/lanyard/card-back.svg";
import cardFront from "./assets/lanyard/card-front.svg";

const lanyardRoot = document.querySelector("[data-lanyard-root]");

if (lanyardRoot instanceof HTMLElement) {
  createRoot(lanyardRoot).render(
    <Lanyard
      position={[0, 0, 22]}
      gravity={[0, -40, 0]}
      fov={15.6}
      frontImage={cardFront}
      backImage={cardBack}
      imageFit="cover"
      lanyardWidth={0.54}
      sceneOffset={[2.36, 1.12, 0]}
      mobileSceneOffset={[0.72, 1.1, 0]}
    />,
  );
}
