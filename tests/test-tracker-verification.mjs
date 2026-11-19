import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4177;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/tracker');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\tracker';

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

  // Clear localStorage for a clean start
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  async function getTrackerState() {
    return await page.evaluate(() => {
      const statusBadge = document.querySelector('.tracker-status-badge');
      const activityLabel = document.querySelector('.tracker-activity');
      const chamberTitle = document.querySelector('.chamber-title');
      const unorderedBadge = document.querySelector('.chamber-badge-unordered');
      const countRemaining = document.querySelector('.chamber-count-remaining');
      const countTotal = document.querySelector('.chamber-count-total');
      const liveCapsules = document.querySelectorAll('.chamber-capsule--live').length;
      const blankCapsules = document.querySelectorAll('.chamber-capsule--blank').length;
      const spentCapsules = document.querySelectorAll('.chamber-capsule--spent').length;
      const historyDots = document.querySelectorAll('.tracker-history-dot').length;

      return {
        status: statusBadge ? statusBadge.textContent.trim() : null,
        activity: activityLabel ? activityLabel.textContent.trim() : null,
        chamberTitle: chamberTitle ? chamberTitle.textContent.trim() : null,
        unordered: unorderedBadge ? unorderedBadge.textContent.trim() : null,
        remaining: countRemaining ? countRemaining.textContent.trim() : null,
        total: countTotal ? countTotal.textContent.trim() : null,
        liveCapsules,
        blankCapsules,
        spentCapsules,
        historyDots,
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

  // 1. Fresh active session with default preset 2L, 2B (no shots)
  console.log('\n--- Step 1: Start New Session (2L, 2B) ---');
  const startBtn = await page.$('.btn-start-tracking');
  await startBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  let state = await getTrackerState();
  console.log('Fresh Session State:', state);
  if (state.activity !== 'No shots fired') {
    throw new Error(`Expected "No shots fired", got "${state.activity}"`);
  }
  await saveScreenshot('tracker-1-fresh-session.png');

  // 2. Record Live shot -> 1 shot fired
  console.log('\n--- Step 2: Record Live Shot ---');
  const liveBtn = await page.$('button[aria-label^="Shoot Live"]');
  await liveBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  state = await getTrackerState();
  console.log('After Live Shot:', state);
  if (state.activity !== '1 shot fired') {
    throw new Error(`Expected "1 shot fired", got "${state.activity}"`);
  }

  // 3. Record Blank shot -> 2 shots fired
  console.log('\n--- Step 3: Record Blank Shot ---');
  const blankBtn = await page.$('button[aria-label^="Shoot Blank"]');
  await blankBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  state = await getTrackerState();
  console.log('After Blank Shot:', state);
  if (state.activity !== '2 shots fired') {
    throw new Error(`Expected "2 shots fired", got "${state.activity}"`);
  }
  await saveScreenshot('tracker-2-active-shots.png');

  // 4. Undo the last shot -> returns to 1 shot fired!
  console.log('\n--- Step 4: Undo Last Shot ---');
  const undoBtn = await page.$('button[aria-label*="Undo"]');
  await undoBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  state = await getTrackerState();
  console.log('After Undo:', state);
  if (state.activity !== '1 shot fired') {
    throw new Error(`Expected "1 shot fired" after undo, got "${state.activity}"`);
  }
  if (state.liveCapsules !== 1 || state.blankCapsules !== 2 || state.spentCapsules !== 1) {
    throw new Error(`Inventory capsules mismatch after undo: ${JSON.stringify(state)}`);
  }
  await saveScreenshot('tracker-3-after-undo.png');

  // 5. Refresh page & confirm restoration
  console.log('\n--- Step 5: Refresh Page & Verify Restoration ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));

  state = await getTrackerState();
  console.log('Restored State after Refresh:', state);
  if (state.activity !== '1 shot fired') {
    throw new Error(`Expected "1 shot fired" after refresh, got "${state.activity}"`);
  }
  if (state.liveCapsules !== 1 || state.blankCapsules !== 2 || state.spentCapsules !== 1) {
    throw new Error(`Restored capsules mismatch: ${JSON.stringify(state)}`);
  }

  // 6. Reset & Create Mixed Inventory (3 Live, 3 Blank)
  console.log('\n--- Step 6: Mixed Inventory (3L, 3B) ---');
  // Click Reset / New Load
  const resetBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent.includes('NEW LOAD') || b.textContent.includes('RESET'));
  });
  await resetBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  // If confirm modal popped up, confirm it
  const confirmBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent.includes('DISCARD'));
  });
  if (confirmBtn && (await confirmBtn.boundingBox())) {
    await confirmBtn.click();
    await new Promise((r) => setTimeout(r, 200));
  }

  // We are back on setup screen. Select 3L · 3B preset
  const presetBtns = await page.$$('.preset-item');
  if (presetBtns.length >= 4) {
    await presetBtns[3].click(); // 3L · 3B
    await new Promise((r) => setTimeout(r, 200));
  }
  const startBtn2 = await page.$('.btn-start-tracking');
  await startBtn2.click();
  await new Promise((r) => setTimeout(r, 300));

  state = await getTrackerState();
  console.log('3L, 3B Mixed Inventory State:', state);
  await saveScreenshot('tracker-4-mixed-inventory.png');

  // 7. Shoot all 3 blanks -> only Live ammunition remains
  console.log('\n--- Step 7: Only Live Ammunition Remains ---');
  const blankBtn2 = await page.$('button[aria-label^="Shoot Blank"]');
  await blankBtn2.click();
  await new Promise((r) => setTimeout(r, 150));
  await blankBtn2.click();
  await new Promise((r) => setTimeout(r, 150));
  await blankBtn2.click();
  await new Promise((r) => setTimeout(r, 150));

  state = await getTrackerState();
  console.log('Only Live Remaining State:', state);
  if (state.liveCapsules !== 3 || state.blankCapsules !== 0) {
    throw new Error(`Expected 3 live and 0 blank, got ${state.liveCapsules}L, ${state.blankCapsules}B`);
  }
  await saveScreenshot('tracker-5-only-live.png');

  // 8. Reset & Create 1 Live, 3 Blank -> Shoot Live -> only Blank ammunition remains
  console.log('\n--- Step 8: Only Blank Ammunition Remains ---');
  const resetBtn2 = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent.includes('NEW LOAD') || b.textContent.includes('RESET'));
  });
  await resetBtn2.click();
  await new Promise((r) => setTimeout(r, 200));

  const confirmBtn2 = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent.includes('DISCARD'));
  });
  if (confirmBtn2 && (await confirmBtn2.boundingBox())) {
    await confirmBtn2.click();
    await new Promise((r) => setTimeout(r, 200));
  }

  // On setup screen: Live = 1, Blank = 3
  // Click preset 1L · 1B then increment blank twice
  const presetBtns2 = await page.$$('.preset-item');
  await presetBtns2[0].click(); // 1L, 1B
  await new Promise((r) => setTimeout(r, 150));
  const incBtns = await page.$$('button[aria-label^="Increase"]');
  await incBtns[1].click(); // Blank 2
  await incBtns[1].click(); // Blank 3
  await new Promise((r) => setTimeout(r, 150));

  const startBtn3 = await page.$('.btn-start-tracking');
  await startBtn3.click();
  await new Promise((r) => setTimeout(r, 300));

  // Now shoot 1 live shell
  const liveBtn2 = await page.$('button[aria-label^="Shoot Live"]');
  await liveBtn2.click();
  await new Promise((r) => setTimeout(r, 200));

  state = await getTrackerState();
  console.log('Only Blank Remaining State:', state);
  if (state.liveCapsules !== 0 || state.blankCapsules !== 3) {
    throw new Error(`Expected 0 live and 3 blank, got ${state.liveCapsules}L, ${state.blankCapsules}B`);
  }
  await saveScreenshot('tracker-6-only-blank.png');

  // 9. Viewport 320px check
  console.log('\n--- Step 9: Viewport 320px ---');
  await page.setViewport({ width: 320, height: 750, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 150));
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('320px horizontal overflow:', overflow320);
  if (overflow320) throw new Error('Horizontal overflow detected at 320px!');
  await saveScreenshot('tracker-7-width-320px.png');

  // 10. Viewport 390px check
  console.log('\n--- Step 10: Viewport 390px ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 150));
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('390px horizontal overflow:', overflow390);
  if (overflow390) throw new Error('Horizontal overflow detected at 390px!');
  await saveScreenshot('tracker-8-width-390px.png');

  // 11. Responsive Widths Matrix
  const widths = [320, 360, 375, 390, 430, 768];
  console.log('\n--- Responsive Widths Matrix ---');
  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 50));
    const res = await page.evaluate(() => {
      const doc = document.documentElement;
      const status = document.querySelector('.tracker-status-bar');
      const card = document.querySelector('.chamber-inventory-card');
      return {
        overflow: doc.scrollWidth > doc.clientWidth,
        statusWidth: status ? status.getBoundingClientRect().width : null,
        cardWidth: card ? card.getBoundingClientRect().width : null,
      };
    });
    console.log(`Width ${w}px: overflow=${res.overflow}, cardWidth=${res.cardWidth?.toFixed(1)}px`);
    if (res.overflow) throw new Error(`Horizontal overflow at ${w}px!`);
  }

  await browser.close();
  server.close();
  console.log('\nTracker verification completed successfully.');
}

run().catch((err) => {
  console.error('Error in tracker verification:', err);
  process.exit(1);
});
