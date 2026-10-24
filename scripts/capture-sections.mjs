// Captures the fencing options section on desktop + mobile for visual review.
import puppeteer from "puppeteer-core";
import fs from "node:fs/promises";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:3100";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--hide-scrollbars", "--disable-gpu"],
  });

  const shots = [
    { name: "desktop", width: 1440, height: 900, dpr: 1 },
    { name: "mobile", width: 390, height: 844, dpr: 2 },
  ];

  for (const s of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: s.dpr });
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 120000 });
    await sleep(1200);
    // Scroll well past the hero quickly so reveal animations have fired,
    // settle back to the section top for a valid capture.
    const sectionTop = await page.evaluate(() => {
      const el = document.querySelector("section[aria-labelledby='fencing-options-heading']");
      return el ? el.offsetTop : 0;
    });
    // Force reveals: disabled once behavior already ran; batch is once:true.
    await page.evaluate((t) => window.scrollTo(0, t + 600), sectionTop);
    await sleep(1200);
    await page.evaluate(() => {
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.visibility = "visible";
        });
    });
    await sleep(400);
    await page.screenshot({
      path: `/tmp/review-${s.name}.png`,
      fullPage: true,
    });
    console.log(s.name, "captured");
    await page.close();
  }

  await browser.close();
  await fs.writeFile("/tmp/review-ready.txt", "done");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
