// Functional test of the fencing options section: filters, reset, anchor CTA.
import puppeteer from "puppeteer-core";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chip(page, label) {
  const clicked = await page.evaluate((label) => {
    const chips = Array.from(document.querySelectorAll("button[class*='chip']"));
    const target = chips.find(
      (b) => b.textContent.trim() === label && b.getAttribute("aria-pressed") === "false"
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, label);
  await sleep(350);
  return clicked;
}

async function count(page) {
  return page.evaluate(() =>
    document.querySelectorAll("ul[class*='grid'] article").length
  );
}

async function statusText(page) {
  return page.evaluate(() =>
    (document.querySelector("p[role='status']")?.textContent || "").trim()
  );
}

async function cardNames(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("ul[class*='grid'] h3")).map((h) =>
      h.textContent.trim()
    )
  );
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e)));
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto("http://localhost:3100", { waitUntil: "networkidle2", timeout: 120000 });
await sleep(1000);

const results = [];
const check = (name, ok) => results.push([ok, name]);

// 1. All 8 cards initially
check("8 cards initially shown", (await count(page)) === 8);

// 2. Privacy filter -> fully private
await chip(page, "Fully private");
check("Fully private -> 3 cards (wood, vinyl, composite)", (await count(page)) === 3);
const privateNames = await cardNames(page);
check(
  "fully private names correct",
  ["Wood Privacy Fencing", "Vinyl (PVC) Fencing", "Composite Fencing"].every((n) =>
    privateNames.includes(n)
  )
);

// 3. Budget economy with privacy filter -> no matches -> empty state
await chip(page, "Economy");
await sleep(500);
const emptyState = await page.evaluate(
  () => !!document.querySelector("button[class*='resetBtn']")
);
check("empty state with reset button", emptyState === true);

// 4. Reset
await page.evaluate(() => document.querySelector("button[class*='resetBtn']").click());
await sleep(400);
check("reset restores 8 cards", (await count(page)) === 8);

// 5. Budget economy alone
await chip(page, "Economy");
const economyNames = await cardNames(page);
check(
  "economy = chain-link, split-rail, farm-ranch",
  ["Chain-Link Fencing", "Split-Rail Fencing", "Farm & Ranch Fencing"].every((n) =>
    economyNames.includes(n)
  ) && economyNames.length === 3
);

// 6. Budget reset via chip, then material filter alone
await chip(page, "Any budget");
await sleep(300);
await chip(page, "Ornamental Aluminum");
check("material aluminum -> 1 card", (await count(page)) === 1);

// 7. Reset back (budget chip AND material chip)
await chip(page, "Any budget");
await sleep(250);
await chip(page, "All");
await sleep(300);

// 8. CTA anchor: click "Request Pricing" from first card -> window moves toward #quote
const beforeY = await page.evaluate(() => window.scrollY);
await page.evaluate(() => {
  const cta = Array.from(document.querySelectorAll("a[href='#quote']"))[0];
  cta?.scrollIntoView({ behavior: "instant" });
  cta?.click();
});
await sleep(800);
const quoteVisible = await page.evaluate(() => {
  const el = document.getElementById("quote");
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  // Page-bottom clamp: the placeholder is the last element, so "visible" means
  // intersecting the viewport, not sitting at top 0.
  return r.top < vh && r.bottom > 0;
});
check("CTA navigates to #quote section", quoteVisible === true);
await sleep(300);
const afterY = await page.evaluate(() => window.scrollY);
check("page actually moved for #quote", afterY > 4000);

// 9. status text format valid
const status = await statusText(page);
check("status text valid", /^8 of 8 fence types shown$/.test(status) || /^8 of 8/.test(status));

check("no page errors", errors.length === 0);
console.log("errors:", errors.slice(0, 5));

let pass = true;
for (const [ok, name] of results) {
  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) pass = false;
}
console.log(pass ? "ALL_OK" : "HAS_FAILURES");
await browser.close();
process.exit(pass ? 0 : 1);
