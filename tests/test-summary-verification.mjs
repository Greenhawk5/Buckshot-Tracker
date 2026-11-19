import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4176;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/summary');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\summary';

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
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const hash = `#tgWebAppData=user%3D${encodeURIComponent(JSON.stringify({ id: 100, first_name: 'Tactician' }))}%26auth_date%3D1700000000`;
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle0' });

  async function getSummaryData() {
    return await page.evaluate(() => {
      const card = document.querySelector('.setup-action-card');
      const countEl = document.querySelector('.setup-summary-count');
      const liveBreakdown = document.querySelector('.setup-summary-val--live');
      const blankBreakdown = document.querySelector('.setup-summary-val--blank');
      const liveSegment = document.querySelector('.setup-ratio-segment--live');
      const blankSegment = document.querySelector('.setup-ratio-segment--blank');
      const startBtn = document.querySelector('.btn-start-tracking');

      return {
        total: countEl ? countEl.textContent.trim() : null,
        liveText: liveBreakdown ? liveBreakdown.textContent.trim() : null,
        blankText: blankBreakdown ? blankBreakdown.textContent.trim() : null,
        liveWidth: liveSegment ? liveSegment.style.width : null,
        blankWidth: blankSegment ? blankSegment.style.width : null,
        buttonText: startBtn ? startBtn.textContent.trim() : null,
        buttonDisabled: startBtn ? startBtn.disabled : null,
        buttonHeight: startBtn ? startBtn.getBoundingClientRect().height : null,
        cardHeight: card ? card.getBoundingClientRect().height : null,
      };
    });
  }

  async function saveScreenshot(filename) {
    const outPath = path.join(OUTPUT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: outPath, fullPage: true });
    fs.copyFileSync(outPath, artPath);
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. Default State (2 Live, 2 Blank)
  console.log('\n--- Test 1: Default State (2L, 2B) ---');
  let data = await getSummaryData();
  console.log('Default Summary Data:', data);
  await saveScreenshot('summary-default-2l-2b.png');

  // 2. Preset 1L · 1B
  console.log('\n--- Test 2: 1 Live, 1 Blank ---');
  const presetButtons = await page.$$('.preset-item');
  if (presetButtons.length >= 1) {
    await presetButtons[0].click(); // click '1L · 1B'
    await new Promise((r) => setTimeout(r, 200));
    data = await getSummaryData();
    console.log('1L · 1B Summary Data:', data);
    await saveScreenshot('summary-1l-1b.png');
  }

  // 3. Different Ratio (3 Live, 2 Blank)
  console.log('\n--- Test 3: Ratio 3 Live, 2 Blank ---');
  if (presetButtons.length >= 3) {
    await presetButtons[2].click(); // click '3L · 2B'
    await new Promise((r) => setTimeout(r, 200));
    data = await getSummaryData();
    console.log('3L · 2B Summary Data:', data);
    await saveScreenshot('summary-ratio-3l-2b.png');
  }

  // 4. Viewport 320px
  console.log('\n--- Test 4: Viewport 320px ---');
  await page.setViewport({ width: 320, height: 700, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 150));
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('320px horizontal overflow:', overflow320);
  data = await getSummaryData();
  console.log('320px Summary Data:', data);
  await saveScreenshot('summary-width-320px.png');

  // 5. Viewport 390px
  console.log('\n--- Test 5: Viewport 390px ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 150));
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('390px horizontal overflow:', overflow390);
  await saveScreenshot('summary-width-390px.png');

  // 5b. Invalid / Error State (0 Live, 0 Blank)
  console.log('\n--- Test 5b: Invalid Total Rounds (< 2) ---');
  const decrBtns = await page.$$('button[aria-label^="Decrease"]');
  if (decrBtns.length >= 2) {
    // Current is 3 Live, 2 Blank. Decrement Live 3 times, Blank 2 times to reach 0
    await decrBtns[0].click();
    await decrBtns[0].click();
    await decrBtns[0].click();
    await decrBtns[1].click();
    await decrBtns[1].click();
    await new Promise((r) => setTimeout(r, 200));
    const invalidData = await page.evaluate(() => {
      const alert = document.querySelector('.setup-validation-alert');
      const btn = document.querySelector('.btn-start-tracking');
      const count = document.querySelector('.setup-summary-count');
      return {
        count: count ? count.textContent : null,
        alertText: alert ? alert.textContent : null,
        btnDisabled: btn ? btn.disabled : null,
      };
    });
    console.log('Invalid state data:', invalidData);
    await saveScreenshot('summary-validation-error.png');
  }

  // 6. Responsive Widths Matrix
  const widths = [320, 360, 375, 390, 430, 768];
  console.log('\n--- Responsive Widths Matrix ---');
  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 50));
    const res = await page.evaluate(() => {
      const doc = document.documentElement;
      const card = document.querySelector('.setup-action-card');
      const btn = document.querySelector('.btn-start-tracking');
      return {
        overflow: doc.scrollWidth > doc.clientWidth,
        cardWidth: card ? card.getBoundingClientRect().width : null,
        btnHeight: btn ? btn.getBoundingClientRect().height : null,
      };
    });
    console.log(`Width ${w}px: overflow=${res.overflow}, cardWidth=${res.cardWidth?.toFixed(1)}px, btnHeight=${res.btnHeight?.toFixed(1)}px`);
  }

  // 7. Test Start Tracking click transitions to tracker screen
  console.log('\n--- Test 7: Start Tracking Click Activation ---');
  // Re-select preset 2L · 2B so counts are valid
  const presetsAgain = await page.$$('.preset-item');
  if (presetsAgain.length >= 2) {
    await presetsAgain[1].click(); // 2L · 2B
    await new Promise((r) => setTimeout(r, 200));
  }
  const startBtn = await page.$('.btn-start-tracking');
  await startBtn.click();
  await new Promise((r) => setTimeout(r, 400));
  const screenState = await page.evaluate(() => {
    const liveShotBtn = document.querySelector('button[aria-label^="Shoot Live"]');
    const blankShotBtn = document.querySelector('button[aria-label^="Shoot Blank"]');
    return {
      hasTrackerLiveButton: !!liveShotBtn,
      hasTrackerBlankButton: !!blankShotBtn,
      hasSetupScreen: !!document.querySelector('.setup-action-card'),
    };
  });
  console.log('Screen state after Start Tracking click:', screenState);

  await browser.close();
  server.close();
  console.log('\nVerification suite finished successfully.');
}

run().catch((err) => {
  console.error('Error in verification:', err);
  process.exit(1);
});
