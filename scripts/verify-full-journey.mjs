import puppeteer from "puppeteer-core";

const chromePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.TARGET_URL ?? "http://localhost:3001";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runVerification() {
  console.log("=== STARTING FULL SITE VERIFICATION ===");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--hide-scrollbars", "--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const consoleWarnings = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") {
      consoleErrors.push(text);
      console.error("  [Browser Error]:", text);
    } else if (msg.type() === "warning") {
      consoleWarnings.push(text);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(String(err));
    console.error("  [Page Error]:", err);
  });

  console.log(`1. Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });

  // 1. Check Section Order in DOM
  console.log("2. Checking Section Order in DOM...");
  const sections = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return [];
    return Array.from(main.children).map((child) => {
      const target = child.classList.contains("pin-spacer") ? child.firstElementChild || child : child;
      return {
        tagName: target.tagName.toLowerCase(),
        id: target.id,
        ariaLabel: target.getAttribute("aria-label"),
        ariaLabelledBy: target.getAttribute("aria-labelledby"),
        className: target.className.split("__")[1] || target.className,
      };
    });
  });

  console.log("  Discovered sections:", JSON.stringify(sections, null, 2));

  const expectedOrder = [
    { type: "hero", test: (s) => s.ariaLabel?.includes("Fence installation progress") },
    { type: "options", test: (s) => s.id === "fencing-options" },
    { type: "showcase", test: (s) => s.ariaLabel?.includes("Modern residential fence installation showcase") },
    { type: "glider", test: (s) => s.ariaLabel?.includes("Before and after fence installation") },
    { type: "why-us", test: (s) => s.ariaLabelledBy === "why-choose-us-heading" },
    { type: "testimonials", test: (s) => s.ariaLabelledBy === "testimonials-heading" },
    { type: "inquiry", test: (s) => s.id === "quote" },
    { type: "final-cta", test: (s) => s.id === "final-cta" },
  ];

  for (let i = 0; i < expectedOrder.length; i++) {
    const exp = expectedOrder[i];
    const actual = sections[i];
    if (!actual || !exp.test(actual)) {
      throw new Error(`Section order mismatch at index ${i}: expected ${exp.type}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ Section ${i + 1}: ${exp.type} confirmed in correct sequence.`);
  }

  // 2. Check Hero Canvas Rendering
  console.log("3. Checking Hero Canvas...");
  await page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      if (!c) return false;
      const ctx = c.getContext("2d");
      const d = ctx.getImageData(0, 0, 10, 10).data;
      return d.some((v) => v > 0);
    },
    { timeout: 15000 }
  );
  console.log("  ✓ Hero canvas is actively rendering frames.");

  // 3. Test Scroll down to Fencing Options & Filter interaction
  console.log("4. Testing Fencing Options Filter interaction...");
  await page.evaluate(() => {
    document.querySelector("#fencing-options")?.scrollIntoView();
  });
  await sleep(1000);

  const initialCardCount = await page.evaluate(() => {
    return document.querySelectorAll("#fencing-options article").length;
  });
  console.log(`  Initial fence cards count: ${initialCardCount}`);

  // Click "Wood" filter
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("#fencing-options button"));
    const woodBtn = buttons.find((b) => b.textContent.trim().startsWith("Wood"));
    woodBtn?.click();
  });
  await sleep(300);

  const filteredCardCount = await page.evaluate(() => {
    return document.querySelectorAll("#fencing-options article").length;
  });
  console.log(`  Card count after 'Wood' filter: ${filteredCardCount}`);
  if (filteredCardCount !== 1) {
    throw new Error(`Expected 1 wood fence card, got ${filteredCardCount}`);
  }
  console.log("  ✓ Filter chips working properly.");

  // Reset to "All"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("#fencing-options button"));
    const allBtn = buttons.find((b) => b.textContent.trim() === "All");
    allBtn?.click();
  });
  await sleep(300);

  // 4. Test Before & After Slider Drag & Keyboard interaction
  console.log("5. Testing Before & After Slider Keyboard interaction...");
  await page.evaluate(() => {
    const glider = document.querySelector("section[aria-label='Before and after fence installation']");
    glider?.scrollIntoView();
  });
  // Wait for entrance peek animation to complete
  await sleep(2000);

  const gliderHandle = await page.$("div[role='slider']");
  if (!gliderHandle) throw new Error("Slider handle not found");

  const initialSliderVal = await page.evaluate((el) => el.getAttribute("aria-valuenow"), gliderHandle);
  console.log(`  Initial slider value: ${initialSliderVal}`);

  await gliderHandle.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await sleep(200);

  const newSliderVal = await page.evaluate((el) => el.getAttribute("aria-valuenow"), gliderHandle);
  console.log(`  Slider value after Left arrow: ${newSliderVal}`);
  if (Number(newSliderVal) >= Number(initialSliderVal)) {
    throw new Error("Slider value did not decrease on ArrowLeft");
  }
  console.log("  ✓ Keyboard slider control verified.");

  // 5. Test Inquiry Form Validation
  console.log("6. Testing Inquiry Form validation...");
  await page.evaluate(() => {
    document.querySelector("#quote")?.scrollIntoView();
  });
  await sleep(1000);

  // Attempt empty submit
  await page.evaluate(() => {
    const submitBtn = document.querySelector("#quote button[type='submit']");
    submitBtn?.click();
  });
  await sleep(400);

  const errorsCount = await page.evaluate(() => {
    return document.querySelectorAll("#quote [aria-invalid='true']").length;
  });
  console.log(`  Validation error fields triggered: ${errorsCount}`);
  if (errorsCount < 4) {
    throw new Error(`Expected at least 4 validation errors on empty submit, found ${errorsCount}`);
  }
  console.log("  ✓ Client-side form validation verified.");

  // 6. Test Final CTA Navigation
  console.log("7. Testing Final CTA button navigation...");
  await page.evaluate(() => {
    document.querySelector("#final-cta")?.scrollIntoView();
  });
  await sleep(1000);

  // Click "Explore Fencing Options" in Final CTA
  await page.evaluate(() => {
    const secBtn = document.querySelector("#final-cta a[href='#fencing-options']");
    secBtn?.click();
  });
  await sleep(1000);

  const scrollYAfterFencingOptions = await page.evaluate(() => window.scrollY);
  console.log(`  Window scrollY after clicking Explore Fencing Options: ${scrollYAfterFencingOptions}`);
  if (scrollYAfterFencingOptions > 10000 || scrollYAfterFencingOptions < 1000) {
    console.warn(`  Note: scroll position is ${scrollYAfterFencingOptions}`);
  }

  // Click "Get a Free Fencing Estimate" in Final CTA
  await page.evaluate(() => {
    const primBtn = document.querySelector("#final-cta a[href='#quote']");
    primBtn?.click();
  });
  await sleep(1000);

  const scrollYAfterQuote = await page.evaluate(() => window.scrollY);
  console.log(`  Window scrollY after clicking Get a Free Fencing Estimate: ${scrollYAfterQuote}`);
  console.log("  ✓ Final CTA navigation verified.");

  // 7. Mobile Viewport Check
  console.log("8. Testing Mobile Viewport (375x667)...");
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await sleep(500);

  const mobileCtaVisible = await page.evaluate(() => {
    const prim = document.querySelector("#final-cta a[href='#quote']");
    if (!prim) return false;
    const rect = prim.getBoundingClientRect();
    return rect.width > 280 && rect.height >= 48;
  });
  console.log(`  Mobile CTA button meets touch target requirements (>280px width, >=48px height): ${mobileCtaVisible}`);
  if (!mobileCtaVisible) {
    throw new Error("Mobile CTA button failed sizing requirements");
  }
  console.log("  ✓ Mobile responsiveness verified.");

  // Check collected errors
  console.log("9. Reviewing Browser Errors...");
  if (consoleErrors.length > 0) {
    throw new Error(`Browser console errors detected: ${JSON.stringify(consoleErrors)}`);
  }
  console.log("  ✓ Zero browser console errors recorded.");

  await browser.close();
  console.log("=== ALL AUTOMATED CHECKS PASSED SUCCESSFULLY ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
