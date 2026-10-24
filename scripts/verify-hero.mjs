// Verification script: drives the real page in headless Chrome through the
// scroll experience and reports on canvas contents at key scroll positions.
import puppeteer from "puppeteer-core";

const chromePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.TARGET_URL ?? "http://localhost:3100";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(`${URL}/?frameDebug`, { waitUntil: "networkidle2", timeout: 120000 });

  // Wait for first frame to render (load bar is removed after frame 1 is ready).
  await page.waitForFunction(
    () => !document.querySelector("[aria-label='Fence installation progress'] .loadBar, div[class*='loadBar']"),
    { timeout: 120000 }
  );

  // Canvas pixel stats: share of non-black pixels + mean brightness.
  const stat = () =>
    page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, width, height).data;
      let lit = 0;
      let sum = 0;
      const step = 4 * 257; // sample every 16th pixel
      let n = 0;
      for (let i = 0; i < data.length; i += 4 * 16) {
        const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        sum += l;
        if (l > 20) lit += 1;
        n += 1;
      }
      return {
        canvasW: width,
        canvasH: height,
        mean: sum / n,
        litRatio: lit / n,
      };
    });

  const frameSignature = async () =>
    page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, width, height).data;
      let hash = 0;
      for (let i = 0; i < data.length; i += 4 * 101) {
        hash = (hash * 31 + data[i] + data[i + 1] + data[i + 2]) | 0;
      }
      return hash;
    });

  // Slowly wheel down to a given absolute scroll position (Lenis needs real wheel input).
  const scrollToY = async (y) => {
    let current = await page.evaluate(() => window.scrollY);
    const step = 480;
    while (true) {
      const remaining = y - current;
      if (Math.abs(remaining) < step) {
        await page.mouse.wheel({ deltaY: remaining });
        break;
      }
      await page.mouse.wheel({ deltaY: Math.sign(remaining) * step });
      await sleep(120);
      current = await page.evaluate(() => window.scrollY);
      if (Math.sign(y - current) !== Math.sign(remaining)) break;
    }
    // let Lenis + scrub:0.5 settle
    await sleep(1500);
    // Fine-adjust: zero the remaining offset so position checks are exact.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const current = await page.evaluate(() => window.scrollY);
      const diff = y - current;
      if (Math.abs(diff) < 2) break;
      await page.mouse.wheel({ deltaY: diff });
      await sleep(400);
    }
    await sleep(2500);
  };

  const report = [];
  const snap = async (label) => {
    const s = await stat();
    const sig = await frameSignature();
    const scrollY = await page.evaluate(() => window.scrollY);
    const dbg = await page
      .evaluate(() => (window.onerror ? window.onerror : null) && null || window.__frameDebug)
      .catch(() => null);
    report.push({ label, scrollY, ...s, sig, dbg });
    console.log(label.padEnd(22), "scrollY=", String(scrollY).padEnd(6), "mean=", s.mean.toFixed(1), "lit=", s.litRatio.toFixed(3), "sig=", sig, dbg ? `drawn=${dbg.drawnSrc}` : "");
  };

  // 0. Check native height: total scrollable height with pin
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("documentHeight=", docH); // ~ 4000 + hero(900) + after(~540)

  await snap("frame-0 (top)");

  // 1. Mid-sequence: should show construction in progress
  await scrollToY(2000);
  await snap("mid (~frame 96)");

  // 2. Deep: near end of sequence
  await scrollToY(3800);
  await snap("nearly last frame");

  // 3. Past the pin: final frame fully visible
  await scrollToY(4200);
  await snap("last frame (beyond)");

  // 4. Scroll back up: sequence must reverse
  await scrollToY(1200);
  await snap("reverse scroll-back");

  await scrollToY(0);
  await snap("back to frame 0");
  // Wait out the scrub smoothing tail, then re-sample the stable resting state.
  await sleep(6000);
  await snap("final settled");

  const first = report[0];
  const mid = report[1];
  const last = report[3];
  const reversed = report[4];
  const topAgain = report[5];
  const settled = report[6];

  const distinct = (a, b) => a.sig !== b.sig;
  const checks = [
    ["first frame visible", first.litRatio > 0.2],
    ["mid frame differs from first", distinct(first, mid)],
    ["mid frame differs from last", distinct(last, mid)],
    ["last frame differs from first", distinct(first, last)],
    ["reverse scroll renders different frame", distinct(reversed, last)],
    ["return to top stable & shows frame 1", !distinct(topAgain, settled) && settled.dbg?.drawnSrc === "frame_0001.jpg"],
    ["settled render is frame_0001.jpg", settled.dbg?.drawnSrc === "frame_0001.jpg"],
    ["settled frame index is 0", settled.dbg?.index === 0],
    ["no blank mid frame", mid.litRatio > 0.2],
    ["canvas is DPR scaled (no blur flag)", first.canvasW === 3200],
  ];

  let pass = true;
  for (const [name, ok] of checks) {
    console.log(ok ? "PASS" : "FAIL", "-", name);
    if (!ok) pass = false;
  }    console.log("settled.dbg=", JSON.stringify(settled.dbg));
    console.log("consoleErrors=", consoleErrors.slice(0, 10));
  await browser.close();
  console.log(pass && consoleErrors.length === 0 ? "ALL_OK" : "HAS_FAILURES");
}

main().catch((err) => {
  console.error("SCRIPT_ERROR", err);
  process.exit(1);
});
