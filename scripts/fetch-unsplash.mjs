// Loads Unsplash search pages in headless Chrome, extracts candidate photo
// URLs + alt text per fence type, and downloads 1600px candidates.
import puppeteer from "puppeteer-core";
import fs from "node:fs/promises";
import path from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/tmp/fence-candidates";

const TARGETS = {
  "wood-privacy": "wood privacy fence",
  "vinyl-pvc": "vinyl fence",
  "chain-link": "chain link fence",
  aluminum: "black aluminum fence",
  "wrought-iron": "wrought iron fence",
  composite: "composite fence",
  "split-rail": "split rail fence",
  "farm-ranch": "farm fence fields",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function collect(page, query, count = 6) {
  const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  } catch {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  }
  // scroll to trigger lazy loading
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await sleep(700);
  }
  return page.evaluate(
    (count) => {
      const out = [];
      const seen = new Set();
      for (const img of document.querySelectorAll("img[src*='images.unsplash.com/photo-']")) {
        const src = img.getAttribute("src") || "";
        const m = src.match(/photo-[A-Za-z0-9_-]+/);
        if (!m) continue;
        const id = m[0];
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({
          id,
          alt: (img.getAttribute("alt") || "").slice(0, 140),
          url: `https://images.unsplash.com/${id}?w=1600&q=80&fm=jpg&fit=crop`,
        });
        if (out.length >= count) break;
      }
      return out;
    },
    count
  );
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return buf.length;
}

async function main() {
  const files = [];
  const errors = [];
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--hide-scrollbars", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 2400, deviceScaleFactor: 1 });
  page.setDefaultNavigationTimeout(90000);

  await fs.mkdir(OUT, { recursive: true });

  for (const [slug, query] of Object.entries(TARGETS)) {
    let candidates = [];
    try {
      candidates = await collect(page, query, 6);
    } catch (e) {
      errors.push(`${slug}: collect failed ${e.message}`);
    }
    let n = 0;
    for (const cand of candidates) {
      const dest = path.join(OUT, `${slug}-${n + 1}.jpg`);
      try {
        const size = await download(cand.url, dest);
        if (size < 40_000) throw new Error(`too small (${size}b)`);
        files.push({ slug, file: dest, alt: cand.alt });
        n += 1;
        if (n >= 3) break;
      } catch (e) {
        errors.push(`${slug}: ${e.message}`);
      }
    }
    console.log(slug, n, "candidates");
  }

  await browser.close();
  await fs.writeFile(
    path.join(OUT, "index.json"),
    JSON.stringify({ files, errors }, null, 2)
  );
  console.log("errors:", errors.length);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
