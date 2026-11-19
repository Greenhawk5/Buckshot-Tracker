import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4178;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/undo');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\undo';

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

  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  async function getActionsMetrics() {
    return await page.evaluate(() => {
      const undoBtn = document.querySelector('.btn-undo');
      const resetBtn = document.querySelector('.btn-reset-load');
      const labelEl = document.querySelector('.undo-label');
      const badgeEl = document.querySelector('.undo-badge');

      const undoRect = undoBtn ? undoBtn.getBoundingClientRect() : null;
      const resetRect = resetBtn ? resetBtn.getBoundingClientRect() : null;
      const labelRect = labelEl ? labelEl.getBoundingClientRect() : null;

      // Check if text wraps onto multiple lines (compare scrollHeight to single line clientHeight)
      const isSingleLine = labelEl ? labelEl.scrollHeight <= labelEl.clientHeight + 2 : false;

      return {
        undoHeight: undoRect ? undoRect.height : null,
        undoWidth: undoRect ? undoRect.width : null,
        undoDisabled: undoBtn ? undoBtn.disabled : null,
        resetHeight: resetRect ? resetRect.height : null,
        resetWidth: resetRect ? resetRect.width : null,
        heightDiff: (undoRect && resetRect) ? Math.abs(undoRect.height - resetRect.height) : null,
        labelSingleLine: isSingleLine,
        badgeText: badgeEl ? badgeEl.textContent.trim() : null,
        hasBadge: !!badgeEl,
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

  async function saveActionsCloseup(filename) {
    const actionsEl = await page.$('.tracker-bottom-actions');
    if (actionsEl) {
      const outPath = path.join(OUTPUT_DIR, filename);
      const artPath = path.join(ARTIFACT_DIR, filename);
      await actionsEl.screenshot({ path: outPath });
      fs.copyFileSync(outPath, artPath);
      console.log(`Saved closeup: ${filename}`);
    }
  }

  // 1. Setup & Start Fresh Session
  console.log('\n--- Step 1: Start Fresh Session ---');
  const startBtn = await page.$('.btn-start-tracking');
  await startBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  // Disabled State Verification (0 shots)
  console.log('\n--- Step 2: Undo Disabled State (0 shots) ---');
  let metrics = await getActionsMetrics();
  console.log('Disabled Metrics:', metrics);
  if (!metrics.undoDisabled) throw new Error('Expected Undo to be disabled initially');
  if (metrics.hasBadge) throw new Error('Expected no badge in disabled state');
  if (!metrics.labelSingleLine) throw new Error('Undo label wrapped in disabled state');
  if (metrics.heightDiff > 0.5) throw new Error(`Height mismatch: Undo=${metrics.undoHeight}, Reset=${metrics.resetHeight}`);

  await saveScreenshot('undo-disabled-390px.png');
  await saveActionsCloseup('undo-actions-disabled-closeup.png');

  const disabledHeight = metrics.undoHeight;

  // 3. Enabled State — 1 Shot Recorded
  console.log('\n--- Step 3: Undo Enabled State (1 shot) ---');
  const liveBtn = await page.$('button[aria-label^="Shoot Live"]');
  await liveBtn.click();
  await new Promise((r) => setTimeout(r, 250));

  metrics = await getActionsMetrics();
  console.log('Enabled (1 shot) Metrics:', metrics);
  if (metrics.undoDisabled) throw new Error('Expected Undo to be enabled after shot');
  if (!metrics.hasBadge || metrics.badgeText !== '1') throw new Error(`Expected badge "1", got "${metrics.badgeText}"`);
  if (!metrics.labelSingleLine) throw new Error('Undo label wrapped after badge appeared!');
  if (metrics.heightDiff > 0.5) throw new Error(`Height mismatch: Undo=${metrics.undoHeight}, Reset=${metrics.resetHeight}`);
  if (Math.abs(metrics.undoHeight - disabledHeight) > 0.5) {
    throw new Error(`Undo button height changed between disabled (${disabledHeight}) and enabled (${metrics.undoHeight})!`);
  }

  await saveScreenshot('undo-enabled-1shot-390px.png');
  await saveActionsCloseup('undo-actions-enabled-1shot-closeup.png');

  // 4. Enabled State — Multiple Shots Recorded
  console.log('\n--- Step 4: Undo Enabled State (Multiple shots) ---');
  const blankBtn = await page.$('button[aria-label^="Shoot Blank"]');
  await blankBtn.click(); // shot 2
  await new Promise((r) => setTimeout(r, 150));
  await liveBtn.click(); // shot 3
  await new Promise((r) => setTimeout(r, 200));

  metrics = await getActionsMetrics();
  console.log('Enabled (3 shots) Metrics:', metrics);
  if (metrics.badgeText !== '3') throw new Error(`Expected badge "3", got "${metrics.badgeText}"`);
  if (!metrics.labelSingleLine) throw new Error('Undo label wrapped with 3 shots!');
  if (Math.abs(metrics.undoHeight - disabledHeight) > 0.5) throw new Error('Height unstable with multiple shots');

  await saveScreenshot('undo-enabled-multiple-390px.png');
  await saveActionsCloseup('undo-actions-enabled-multiple-closeup.png');

  // 5. Two-digit badge test
  console.log('\n--- Step 5: Two-Digit Badge Test ---');
  // Inject mock badge '12' to verify layout stability with 2 digits
  await page.evaluate(() => {
    const badge = document.querySelector('.undo-badge');
    if (badge) badge.textContent = '12';
  });
  await new Promise((r) => setTimeout(r, 100));

  metrics = await getActionsMetrics();
  console.log('Two-digit badge metrics:', metrics);
  if (!metrics.labelSingleLine) throw new Error('Undo label wrapped with 2-digit badge!');
  if (Math.abs(metrics.undoHeight - disabledHeight) > 0.5) throw new Error('Height unstable with 2-digit badge');
  await saveActionsCloseup('undo-actions-twodigits-closeup.png');

  // 6. Responsive Viewports Matrix (320px, 360px, 375px, 390px, 430px)
  const widths = [320, 360, 375, 390, 430];
  console.log('\n--- Responsive Viewports Matrix (Disabled vs Enabled) ---');

  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 100));

    // Test enabled state at width w
    const enabledRes = await getActionsMetrics();
    const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

    console.log(`Viewport ${w}px [ENABLED]: overflow=${docOverflow}, singleLine=${enabledRes.labelSingleLine}, undoH=${enabledRes.undoHeight?.toFixed(1)}px, resetH=${enabledRes.resetHeight?.toFixed(1)}px, badge="${enabledRes.badgeText}"`);
    if (docOverflow) throw new Error(`Horizontal overflow at ${w}px!`);
    if (!enabledRes.labelSingleLine) throw new Error(`Label wrapped at ${w}px in enabled state!`);
    if (enabledRes.heightDiff > 0.5) throw new Error(`Height difference at ${w}px!`);

    if (w === 320) {
      await saveScreenshot('undo-enabled-320px.png');
      await saveActionsCloseup('undo-actions-enabled-320px-closeup.png');
    }

    // Now test disabled state at width w (reload fresh)
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    const sBtn = await page.$('.btn-start-tracking');
    await sBtn.click();
    await new Promise((r) => setTimeout(r, 200));

    const disabledRes = await getActionsMetrics();
    console.log(`Viewport ${w}px [DISABLED]: singleLine=${disabledRes.labelSingleLine}, undoH=${disabledRes.undoHeight?.toFixed(1)}px, resetH=${disabledRes.resetHeight?.toFixed(1)}px`);
    if (!disabledRes.labelSingleLine) throw new Error(`Label wrapped at ${w}px in disabled state!`);
    if (disabledRes.heightDiff > 0.5) throw new Error(`Height difference at ${w}px!`);
    if (Math.abs(enabledRes.undoHeight - disabledRes.undoHeight) > 0.5) {
      throw new Error(`Height mismatch between disabled and enabled at ${w}px: disabled=${disabledRes.undoHeight}, enabled=${enabledRes.undoHeight}`);
    }

    if (w === 320) {
      await saveScreenshot('undo-disabled-320px.png');
      await saveActionsCloseup('undo-actions-disabled-320px-closeup.png');
    }
  }

  await browser.close();
  server.close();
  console.log('\nUndo button verification completed successfully.');
}

run().catch((err) => {
  console.error('Error in undo verification:', err);
  process.exit(1);
});
