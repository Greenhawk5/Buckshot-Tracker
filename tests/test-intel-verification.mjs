import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4182;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/intel');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\intel';

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

  // Clear local storage and start fresh session
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  async function saveScreenshot(filename) {
    const outPath = path.join(OUTPUT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: outPath, fullPage: true });
    fs.copyFileSync(outPath, artPath);
    console.log(`Saved screenshot: ${filename}`);
  }

  async function saveElementShot(selector, filename) {
    const el = await page.$(selector);
    if (el) {
      const outPath = path.join(OUTPUT_DIR, filename);
      const artPath = path.join(ARTIFACT_DIR, filename);
      await el.screenshot({ path: outPath });
      fs.copyFileSync(outPath, artPath);
      console.log(`Saved element screenshot: ${filename}`);
    }
  }

  // --- Step 1: Configure 3 Live / 3 Blank Loadout on Setup Screen ---
  console.log('\n--- Step 1: Select 3L / 3B Loadout ---');
  // Click 3L · 3B preset
  const presetButtons = await page.$$('.preset-item');
  // presets: 0: 1L 1B, 1: 2L 2B, 2: 3L 2B, 3: 3L 3B, 4: 4L 4B
  if (presetButtons.length >= 4) {
    await presetButtons[3].click(); // 3L 3B
  }
  await new Promise((r) => setTimeout(r, 100));

  const startBtn = await page.$('.btn-start-tracking');
  await startBtn.click();
  await page.waitForSelector('.known-shells-card');

  // Verify empty known shells state
  const emptyText = await page.$eval('.known-shells-empty', (el) => el.textContent.trim());
  console.log('Empty state text:', emptyText);
  await saveScreenshot('intel-01-empty-state-390px.png');

  // --- Step 2: Open Burner Phone Modal & Add Pos 2 as Blank ---
  console.log('\n--- Step 2: Add Pos 2 as Blank ---');
  const phoneBtn = await page.$('.btn-utility-phone');
  await phoneBtn.click();
  await page.waitForSelector('.burner-modal-card');

  await saveScreenshot('intel-02-modal-opened-390px.png');

  // Select position 2
  const posChips = await page.$$('.btn-pos-chip');
  console.log(`Found ${posChips.length} position chips in modal`);
  await posChips[0].click(); // first chip is 2

  // Select Blank
  const blankTypeBtn = await page.$('.btn-type-choice--blank');
  await blankTypeBtn.click();

  await new Promise((r) => setTimeout(r, 100));

  // Click Confirm
  const confirmBtn = await page.$('.btn-modal-confirm');
  await confirmBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  // --- Step 3: Add Pos 4 as Live ---
  console.log('\n--- Step 3: Add Pos 4 as Live ---');
  await phoneBtn.click();
  await page.waitForSelector('.burner-modal-card');

  const chipsAgain = await page.$$('.btn-pos-chip');
  // Chip 0 is 2, Chip 1 is 3, Chip 2 is 4
  await chipsAgain[2].click(); // pos 4

  const liveTypeBtn = await page.$('.btn-type-choice--live');
  await liveTypeBtn.click();
  await new Promise((r) => setTimeout(r, 100));

  const confirmBtn2 = await page.$('.btn-modal-confirm');
  await confirmBtn2.click();
  await new Promise((r) => setTimeout(r, 200));

  await saveScreenshot('intel-03-two-known-shells-390px.png');
  await saveElementShot('.known-shells-card', 'intel-03-card-closeup.png');

  // Verify 2 known items
  let intelItems = await page.$$eval('.known-shell-item', (items) =>
    items.map((it) => ({
      pos: it.querySelector('.known-shell-pos-badge').textContent.trim(),
      state: it.querySelector('.known-shell-state-pill').textContent.trim(),
      type: it.querySelector('.known-shell-meta-row span').textContent.trim(),
    }))
  );
  console.log('Recorded intelligence:', intelItems);
  if (intelItems.length !== 2) throw new Error('Expected 2 intel items');
  if (intelItems[0].pos !== '2' || intelItems[0].state !== 'UPCOMING') throw new Error('Item 0 mismatch');
  if (intelItems[1].pos !== '4' || intelItems[1].state !== 'UPCOMING') throw new Error('Item 1 mismatch');

  // --- Step 4: Fire 1 Live Shot -> Pos 2 must become Pos 1 (CURRENT SHELL!) ---
  console.log('\n--- Step 4: Fire Shot 1 (Live) -> Check Pos 1 CURRENT SHELL ---');
  const liveShotBtn = await page.$('button[aria-label^="Shoot Live"]');
  await liveShotBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  intelItems = await page.$$eval('.known-shell-item', (items) =>
    items.map((it) => ({
      pos: it.querySelector('.known-shell-pos-badge').textContent.trim(),
      state: it.querySelector('.known-shell-state-pill').textContent.trim(),
      type: it.querySelector('.known-shell-meta-row span').textContent.trim(),
    }))
  );
  console.log('After shot 1, intelligence:', intelItems);
  if (intelItems[0].pos !== '1' || intelItems[0].state !== 'CURRENT SHELL') {
    throw new Error(`Expected position 1 to be CURRENT SHELL, got ${JSON.stringify(intelItems[0])}`);
  }
  if (intelItems[1].pos !== '3' || intelItems[1].state !== 'UPCOMING') {
    throw new Error(`Expected position 3, got ${JSON.stringify(intelItems[1])}`);
  }

  await saveScreenshot('intel-04-current-shell-active-390px.png');
  await saveElementShot('.known-shells-card', 'intel-04-current-shell-closeup.png');

  // --- Step 5: Fire Position 1 (Blank) -> Consumes Pos 1 intel ---
  console.log('\n--- Step 5: Fire Position 1 (Blank) -> Consumes Pos 1 intel ---');
  const blankShotBtn = await page.$('button[aria-label^="Shoot Blank"]');
  await blankShotBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  intelItems = await page.$$eval('.known-shell-item', (items) =>
    items.map((it) => ({
      pos: it.querySelector('.known-shell-pos-badge').textContent.trim(),
      state: it.querySelector('.known-shell-state-pill').textContent.trim(),
      type: it.querySelector('.known-shell-meta-row span').textContent.trim(),
    }))
  );
  console.log('After shot 2, intelligence:', intelItems);
  if (intelItems.length !== 1) throw new Error('Expected 1 remaining intel item');
  if (intelItems[0].pos !== '2' || intelItems[0].state !== 'UPCOMING') {
    throw new Error(`Expected pos 2 upcoming, got ${JSON.stringify(intelItems[0])}`);
  }

  // --- Step 6: Eject with Beer ---
  console.log('\n--- Step 6: Eject with Beer ---');
  const beerBtn = await page.$('.btn-utility-beer');
  await beerBtn.click();
  await page.waitForSelector('.eject-modal-card');
  await saveScreenshot('intel-05-beer-modal-390px.png');

  // Eject Live
  const ejectLiveBtn = await page.$('.btn-eject-choice--live');
  await ejectLiveBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  intelItems = await page.$$eval('.known-shell-item', (items) =>
    items.map((it) => ({
      pos: it.querySelector('.known-shell-pos-badge').textContent.trim(),
      state: it.querySelector('.known-shell-state-pill').textContent.trim(),
      type: it.querySelector('.known-shell-meta-row span').textContent.trim(),
    }))
  );
  console.log('After ejection, intelligence:', intelItems);
  if (intelItems[0].pos !== '1' || intelItems[0].state !== 'CURRENT SHELL') {
    throw new Error(`Expected position 1 CURRENT SHELL after eject, got ${JSON.stringify(intelItems[0])}`);
  }

  // --- Step 7: Undo Ejection ---
  console.log('\n--- Step 7: Undo Ejection ---');
  const undoBtn = await page.$('.btn-undo');
  await undoBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  intelItems = await page.$$eval('.known-shell-item', (items) =>
    items.map((it) => ({
      pos: it.querySelector('.known-shell-pos-badge').textContent.trim(),
      state: it.querySelector('.known-shell-state-pill').textContent.trim(),
    }))
  );
  console.log('After undo ejection, intelligence:', intelItems);
  if (intelItems[0].pos !== '2') throw new Error('Expected pos 2 restored after undo');

  // --- Step 8: Responsive Verification Matrix ---
  console.log('\n--- Step 8: Responsive Verification Matrix ---');
  const widths = [320, 360, 375, 390, 430, 768];

  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 100));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    console.log(`Viewport ${w}px: overflow=${overflow}`);
    if (overflow) throw new Error(`Horizontal overflow at ${w}px!`);

    if (w === 320 || w === 390 || w === 430) {
      await saveScreenshot(`intel-responsive-${w}px.png`);
    }
  }

  await browser.close();
  server.close();
  console.log('\nAll End-to-End Intelligence scenarios passed successfully!');
}

run().catch((err) => {
  console.error('Error in intel verification:', err);
  process.exit(1);
});
