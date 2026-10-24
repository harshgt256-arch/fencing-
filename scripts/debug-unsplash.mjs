import puppeteer from "puppeteer-core";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 2400 });
page.setDefaultNavigationTimeout(90000);
await page.goto("https://unsplash.com/s/photos/wood-fence", { waitUntil: "networkidle2", timeout: 90000 });
await sleep(3000);
const info = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll("img"));
  return {
    title: document.title,
    imgCount: imgs.length,
    sample: imgs.slice(0, 8).map((i) => (i.getAttribute("src") || i.getAttribute("srcset") || "no-src").slice(0, 120)),
    bodyChars: document.body.innerText.length,
    bodyHead: document.body.innerText.slice(0, 200),
    hasPhotoFigures: document.querySelectorAll("figure[itemscope]").length,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "/tmp/unsplash-page.png" });
await browser.close();
