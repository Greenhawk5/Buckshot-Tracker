import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4174;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/header');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\header';

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

  async function renderTestCase({ viewport, userName, filename }) {
    const page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height || 800,
      deviceScaleFactor: 2,
      isMobile: viewport.width < 768,
      hasTouch: viewport.width < 768,
    });

    let hash = '';
    if (userName) {
      const userObj = JSON.stringify({ id: 100, first_name: userName });
      hash = `#tgWebAppData=user%3D${encodeURIComponent(userObj)}%26auth_date%3D1700000000`;
    }

    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 200));

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.app-header');
      const title = document.querySelector('.brand-title');
      const logo = document.querySelector('.brand-logo');
      const opBadge = document.querySelector('.operator-badge');
      const opName = document.querySelector('.operator-name');
      const syncBadge = document.querySelector('.sync-status-badge');

      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const hasHorizontalScroll = scrollWidth > docWidth;

      return {
        hasHorizontalScroll,
        docWidth,
        scrollWidth,
        logo: {
          width: logo?.offsetWidth,
          height: logo?.offsetHeight,
        },
        title: {
          text: title?.innerText,
          offsetWidth: title?.offsetWidth,
        },
        account: {
          text: opName?.innerText,
          offsetWidth: opName?.offsetWidth,
          scrollWidth: opName?.scrollWidth,
          isEllipsized: (opName?.scrollWidth || 0) > (opName?.offsetWidth || 0),
        },
        sync: {
          text: syncBadge?.innerText,
          offsetWidth: syncBadge?.offsetWidth,
        },
      };
    });

    const dest1 = path.join(OUTPUT_DIR, filename);
    const dest2 = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: dest1 });
    fs.copyFileSync(dest1, dest2);

    await page.close();
    return layout;
  }

  // --------------------------------------------------------------------------
  // TEST MATRIX 1: Viewport Widths (320px, 360px, 375px, 390px, 430px, 768px, 1200px)
  // --------------------------------------------------------------------------
  const widths = [320, 360, 375, 390, 430, 768, 1200];
  console.log('\n--- Testing Viewport Widths ---');
  for (const w of widths) {
    const layout = await renderTestCase({
      viewport: { width: w },
      userName: 'Tactician',
      filename: `width-${w}px.png`,
    });
    console.log(
      `Width ${w}px: scrollOverflow=${layout.hasHorizontalScroll}, logo=${layout.logo.width}x${layout.logo.height}, title="${layout.title.text}" (${layout.title.offsetWidth}px), account="${layout.account.text}" (${layout.account.offsetWidth}px), sync="${layout.sync.text}"`
    );
  }

  // --------------------------------------------------------------------------
  // TEST MATRIX 2: Account Names (Long, Mathematical Unicode, RTL, Empty)
  // --------------------------------------------------------------------------
  console.log('\n--- Testing Diverse Account Names at 360px & 390px ---');
  const accountTestCases = [
    { name: 'Long Name', val: 'Alexander Maximillian von Hohenzollern', file: 'account-long-name.png' },
    { name: 'Mathematical / Unicode', val: '𝕿𝖆𝖈𝖙𝖎𝖈𝖎𝖆𝖓 🎯', file: 'account-unicode-math.png' },
    { name: 'Persian / Arabic RTL', val: 'علی رضا فانیانی', file: 'account-persian-rtl.png' },
    { name: 'Empty / Null', val: null, file: 'account-empty.png' },
  ];

  for (const tc of accountTestCases) {
    const layout = await renderTestCase({
      viewport: { width: 375 },
      userName: tc.val,
      filename: tc.file,
    });
    console.log(
      `Account [${tc.name}]: text="${layout.account.text}", overflow=${layout.hasHorizontalScroll}, width=${layout.account.offsetWidth}px (scroll=${layout.account.scrollWidth}px, ellipsized=${layout.account.isEllipsized})`
    );
  }

  await browser.close();
  server.close();
  console.log('\nAll test matrix screenshots captured successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
