import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

const url = "http://127.0.0.1:5173";
const screenshotDir = "verification";
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  throw new Error("No Chrome or Edge executable found for Playwright verification.");
}

mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--disable-gpu-sandbox"],
});

function analyzePng(buffer) {
  const png = PNG.sync.read(buffer);
  let inkSamples = 0;
  let totalSamples = 0;
  let signature = 0;
  const step = Math.max(2, Math.floor(Math.sqrt((png.width * png.height) / 6500)));

  for (let y = 0; y < png.height; y += step) {
    for (let x = 0; x < png.width; x += step) {
      const index = (y * png.width + x) * 4;
      const red = png.data[index] ?? 0;
      const green = png.data[index + 1] ?? 0;
      const blue = png.data[index + 2] ?? 0;
      const alpha = png.data[index + 3] ?? 0;
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

      totalSamples += 1;

      if (alpha > 8 && luminance < 244) {
        inkSamples += 1;
      }

      signature = (signature + (red * 3 + green * 5 + blue * 7 + alpha * 11) * (totalSamples + 1)) % 1000000007;
    }
  }

  return {
    width: png.width,
    height: png.height,
    inkRatio: inkSamples / Math.max(1, totalSamples),
    signature,
  };
}

async function readDomMetrics(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector(".lanyard-wrapper canvas");
    const panel = document.querySelector(".lanyard-panel");

    if (!(canvas instanceof HTMLCanvasElement) || !(panel instanceof HTMLElement)) {
      return { status: "missing" };
    }

    const panelRect = panel.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    return {
      status: "ok",
      panelWidth: panelRect.width,
      panelHeight: panelRect.height,
      canvasWidth: canvasRect.width,
      canvasHeight: canvasRect.height,
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

async function verifyViewport(name, viewport, isMobile, expectLanyard = true) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
  });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(url, { waitUntil: "networkidle" });
  if (!expectLanyard) {
    await page.waitForTimeout(800);

    const mobileDom = await page.evaluate(() => {
      const panel = document.querySelector(".lanyard-panel");
      const panelDisplay = panel instanceof HTMLElement ? getComputedStyle(panel).display : "missing";

      return {
        canvasCount: document.querySelectorAll(".lanyard-wrapper canvas").length,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        panelDisplay,
      };
    });

    await page.screenshot({ path: `${screenshotDir}/lanyard-${name}.png`, fullPage: true });
    await page.close();

    if (mobileDom.canvasCount !== 0 || mobileDom.panelDisplay !== "none") {
      throw new Error(
        `${name}: lanyard should be hidden, canvasCount=${mobileDom.canvasCount}, panelDisplay=${mobileDom.panelDisplay}.`,
      );
    }

    if (mobileDom.horizontalOverflow > 1) {
      throw new Error(`${name}: horizontal overflow detected (${mobileDom.horizontalOverflow}px).`);
    }

    if (consoleErrors.length > 0) {
      throw new Error(`${name}: browser console errors: ${consoleErrors.join(" | ")}`);
    }

    return {
      name,
      lanyard: "hidden",
      overflow: mobileDom.horizontalOverflow,
      panelDisplay: mobileDom.panelDisplay,
    };
  }

  await page.waitForSelector(".lanyard-wrapper canvas", { timeout: 15000 });
  await page.waitForTimeout(1800);

  const beforeDom = await readDomMetrics(page);
  const before = analyzePng(await page.locator(".lanyard-wrapper canvas").screenshot());
  const panelBox = await page.locator(".lanyard-panel").boundingBox();

  if (panelBox) {
    await page.mouse.move(panelBox.x + panelBox.width * 0.42, panelBox.y + panelBox.height * 0.58);
    await page.mouse.down();
    await page.mouse.move(panelBox.x + panelBox.width * 0.56, panelBox.y + panelBox.height * 0.44, { steps: 10 });
    await page.mouse.up();
  }

  await page.waitForTimeout(700);
  const afterDom = await readDomMetrics(page);
  const after = analyzePng(
    await page.locator(".lanyard-wrapper canvas").screenshot({ path: `${screenshotDir}/lanyard-${name}-canvas.png` }),
  );
  await page.screenshot({ path: `${screenshotDir}/lanyard-${name}.png`, fullPage: true });
  await page.close();

  if (beforeDom.status !== "ok" || afterDom.status !== "ok") {
    throw new Error(`${name}: canvas metrics failed (${beforeDom.status}/${afterDom.status}).`);
  }

  if (after.inkRatio < 0.002) {
    throw new Error(`${name}: lanyard canvas appears blank. inkRatio=${after.inkRatio}`);
  }

  if (
    afterDom.panelWidth < 250 ||
    afterDom.panelHeight < 320 ||
    afterDom.canvasWidth < 250 ||
    afterDom.canvasHeight < 320
  ) {
    throw new Error(`${name}: lanyard panel or canvas is too small.`);
  }

  if (afterDom.horizontalOverflow > 1) {
    throw new Error(`${name}: horizontal overflow detected (${afterDom.horizontalOverflow}px).`);
  }

  if (consoleErrors.length > 0) {
    throw new Error(`${name}: browser console errors: ${consoleErrors.join(" | ")}`);
  }

  return {
    name,
    beforeSignature: before.signature,
    afterSignature: after.signature,
    moved: before.signature !== after.signature,
    inkRatio: Number(after.inkRatio.toFixed(4)),
    panel: `${Math.round(afterDom.panelWidth)}x${Math.round(afterDom.panelHeight)}`,
    canvas: `${Math.round(afterDom.canvasWidth)}x${Math.round(afterDom.canvasHeight)}`,
  };
}

try {
  const results = [
    await verifyViewport("desktop", { width: 1440, height: 950 }, false),
    await verifyViewport("mobile", { width: 390, height: 844 }, true, false),
  ];

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
