import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4199;
const DIST_DIR = path.resolve('dist');
const SHOWCASE_DIR = path.resolve('docs/assets/showcase');

fs.mkdirSync(SHOWCASE_DIR, { recursive: true });

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
    defaultViewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  });

  const page = await browser.newPage();

  // Mock Telegram WebApp
  await page.evaluateOnNewDocument(() => {
    window.Telegram = {
      WebApp: {
        initData: 'query_id=showcase&user=%7B%22id%22%3A1001%2C%22first_name%22%3A%22Tactician%22%7D',
        initDataUnsafe: { user: { id: 1001, first_name: 'Tactician' } },
        ready: () => {},
        expand: () => {},
        setHeaderColor: () => {},
        setBackgroundColor: () => {},
        enableClosingConfirmation: () => {},
        disableClosingConfirmation: () => {},
        HapticFeedback: {
          impactOccurred: () => {},
          notificationOccurred: () => {},
          selectionChanged: () => {},
        },
        Serverless: {
          call: (name, input, cb) => cb(null, { ok: true }),
        },
      },
    };
  });

  // 1. Setup Screen
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SHOWCASE_DIR, '01-setup-presets.png') });
  console.log('Saved 01-setup-presets.png');

  // Select 3L / 3B preset
  const presetButtons = await page.$$('.preset-item');
  if (presetButtons.length >= 4) {
    await presetButtons[3].click(); // 3L 3B
  }
  await new Promise((r) => setTimeout(r, 200));

  // Start tracking
  const startBtn = await page.$('.btn-start-tracking');
  await startBtn.click();
  await page.waitForSelector('.known-shells-card');
  await new Promise((r) => setTimeout(r, 300));

  // 2. Active Tracker initial state
  await page.screenshot({ path: path.join(SHOWCASE_DIR, '02-active-tracker.png') });
  console.log('Saved 02-active-tracker.png');

  // 3. Open Burner Phone Modal
  const phoneBtn = await page.$('.btn-utility-phone');
  await phoneBtn.click();
  await page.waitForSelector('.burner-modal-card');
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(SHOWCASE_DIR, '03-burner-phone-modal.png') });
  console.log('Saved 03-burner-phone-modal.png');

  // Select Position 2 as Blank
  const chips = await page.$$('.btn-pos-chip');
  if (chips.length > 0) {
    await chips[0].click(); // first chip is 2
  }
  const blankTypeBtn = await page.$('.btn-type-choice--blank');
  await blankTypeBtn.click();
  const confirmBtn = await page.$('.btn-modal-confirm');
  await confirmBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  // Also add Position 4 as Live
  await phoneBtn.click();
  await page.waitForSelector('.burner-modal-card');
  await new Promise((r) => setTimeout(r, 200));
  const chips2 = await page.$$('.btn-pos-chip');
  if (chips2.length > 1) {
    await chips2[1].click(); // pos 4
  }
  const liveTypeBtn = await page.$('.btn-type-choice--live');
  await liveTypeBtn.click();
  const confirmBtn2 = await page.$('.btn-modal-confirm');
  await confirmBtn2.click();
  await new Promise((r) => setTimeout(r, 300));

  // Fire one Live shot so Pos 2 advances to Pos 1 (CURRENT SHELL!)
  const liveShotBtn = await page.$('button[aria-label^="Shoot Live"]');
  await liveShotBtn.click();
  await new Promise((r) => setTimeout(r, 400));

  // 4. Known Shells Active with Current Shell indicator
  await page.screenshot({ path: path.join(SHOWCASE_DIR, '04-known-shell-positions.png') });
  console.log('Saved 04-known-shell-positions.png');

  // 5. Open Beer Eject Modal
  const beerBtn = await page.$('.btn-utility-beer');
  await beerBtn.click();
  await page.waitForSelector('.eject-modal-card');
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(SHOWCASE_DIR, '05-beer-ejection-modal.png') });
  console.log('Saved 05-beer-ejection-modal.png');

  await browser.close();
  server.close();
  console.log('Showcase generation complete!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
