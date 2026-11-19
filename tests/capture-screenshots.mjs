import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4173;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

// Simple static file server
const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
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
  console.log(`Static server running on http://localhost:${PORT}`);

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

  // Mock Telegram WebApp object
  await page.evaluateOnNewDocument(() => {
    window.Telegram = {
      WebApp: {
        initData: 'query_id=test&user=%7B%22id%22%3A999999%2C%22first_name%22%3A%22Tactician%22%2C%22username%22%3A%22tactician%22%7D',
        initDataUnsafe: {
          user: { id: 999999, first_name: 'Tactician', username: 'tactician' },
        },
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
          call: (name, input, cb) => {
            // Local mock for serverless calls in standalone preview
            cb(null, { ok: true });
          },
        },
      },
    };
  });

  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

  async function saveScreenshot(name) {
    const dest1 = path.join(OUTPUT_DIR, name);
    const dest2 = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: dest1 });
    fs.copyFileSync(dest1, dest2);
    console.log(`Saved screenshot: ${name}`);
  }

  // 1. Setup Screen
  await saveScreenshot('1-setup-screen.png');

  // 2. Click Start Tracking to get Active Tracker
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('START TRACKING')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));
  await saveScreenshot('2-active-tracker.png');

  // 3. Fire several shots (1 Live, 1 Blank)
  const shotButtons = await page.$$('button');
  for (const btn of shotButtons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('LIVE SHOT')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 200));

  const shotButtons2 = await page.$$('button');
  for (const btn of shotButtons2) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('BLANK SHOT')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));
  await saveScreenshot('3-active-tracker-shots.png');

  // 4. Click Reset to open Confirmation Dialog
  const resetButtons = await page.$$('button');
  for (const btn of resetButtons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('RESET / NEW LOAD')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));
  await saveScreenshot('4-confirmation-dialog.png');

  // 5. Dismiss modal by clicking KEEP PLAYING
  const modalButtons = await page.$$('button');
  for (const btn of modalButtons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('KEEP PLAYING')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 200));

  // Now discharge remaining shells (1 Live, 1 Blank remaining) to reach Completed State
  const fireButtons = await page.$$('button');
  for (const btn of fireButtons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('LIVE SHOT')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 200));

  const fireButtons2 = await page.$$('button');
  for (const btn of fireButtons2) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('BLANK SHOT')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));
  await saveScreenshot('5-completed-state.png');

  await browser.close();
  server.close();
  console.log('Finished capturing all 5 screenshots successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
