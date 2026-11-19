import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4180;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/odds');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\odds';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0].split('#')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server running on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const hash = `#tgWebAppData=user%3D${encodeURIComponent(JSON.stringify({ id: 100, first_name: 'Tactician' }))}%26auth_date%3D1700000000`;

  const widths = [320, 360, 375, 390, 430];
  const results = [];

  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle0' });

    // Clear local storage and start fresh session
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // Click Start Tracking
    const startBtn = await page.$('.btn-start-tracking');
    if (!startBtn) throw new Error('Start tracking button not found');
    await startBtn.click();
    await page.waitForSelector('.odds-card');

    const metrics = await page.evaluate(() => {
      const card = document.querySelector('.odds-card');
      const header = document.querySelector('.odds-header');
      const title = document.querySelector('.odds-title');
      const subtitle = document.querySelector('.odds-subtitle');

      const cardRect = card.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const subtitleRect = subtitle.getBoundingClientRect();

      // Check single-line for title
      const titleLineHeight = parseFloat(window.getComputedStyle(title).lineHeight) || 16;
      const titleSingleLine = title.clientHeight <= titleLineHeight * 1.5;

      const hasHorizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

      return {
        cardWidth: cardRect.width,
        cardHeight: cardRect.height,
        titleText: title.innerText,
        titleWidth: titleRect.width,
        titleHeight: titleRect.height,
        titleSingleLine,
        subtitleText: subtitle.innerText,
        subtitleWidth: subtitleRect.width,
        subtitleHeight: subtitleRect.height,
        hasHorizontalOverflow,
      };
    });

    results.push({ viewport: `${w}px`, ...metrics });

    // Capture screenshots
    const fullShotPath = path.join(OUTPUT_DIR, `odds-${w}px-full.png`);
    const fullArtPath = path.join(ARTIFACT_DIR, `odds-${w}px-full.png`);
    await page.screenshot({ path: fullShotPath, fullPage: true });
    fs.copyFileSync(fullShotPath, fullArtPath);

    const cardEl = await page.$('.odds-card');
    const cardShotPath = path.join(OUTPUT_DIR, `odds-${w}px-card.png`);
    const cardArtPath = path.join(ARTIFACT_DIR, `odds-${w}px-card.png`);
    await cardEl.screenshot({ path: cardShotPath });
    fs.copyFileSync(cardShotPath, cardArtPath);

    console.log(`Viewport ${w}px: titleSingleLine=${metrics.titleSingleLine}, overflow=${metrics.hasHorizontalOverflow}, cardWidth=${metrics.cardWidth}px`);
  }

  console.log('\n--- Composition Odds Metrics Table ---');
  console.table(results);

  for (const r of results) {
    if (!r.titleSingleLine) {
      throw new Error(`Title wrapped on viewport ${r.viewport}!`);
    }
    if (r.hasHorizontalOverflow) {
      throw new Error(`Horizontal overflow detected on viewport ${r.viewport}!`);
    }
  }

  await browser.close();
  server.close();
  console.log('\nComposition Odds verification completed successfully.');
}

run().catch((err) => {
  console.error('Error in odds verification:', err);
  process.exit(1);
});
