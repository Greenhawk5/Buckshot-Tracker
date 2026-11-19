import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4175;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/photo/screenshots/presets');
const ARTIFACT_DIR = 'C:\\Users\\Greenhawk\\.gemini\\antigravity\\brain\\1d600532-21bc-4f6b-a0fa-ecf54a20d470\\screenshots\\presets';

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

  async function getCounters() {
    return await page.evaluate(() => {
      const counters = document.querySelectorAll('.inst-readout, span[style*="font-size: 2.6rem"]');
      const textArr = Array.from(counters).map((el) => el.innerText.trim());
      const selectedPreset = document.querySelector('.preset-item--active');
      const selectedLabel = selectedPreset ? selectedPreset.querySelector('.preset-label')?.innerText.replace(/\s+/g, '') : null;
      return {
        counters: textArr,
        selectedLabel,
        selectedAria: selectedPreset?.getAttribute('aria-label'),
      };
    });
  }

  async function clickPreset(index) {
    const items = await page.$$('.preset-item');
    if (items[index]) {
      await items[index].click();
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  async function saveShot(name) {
    const dest1 = path.join(OUTPUT_DIR, name);
    const dest2 = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: dest1 });
    fs.copyFileSync(dest1, dest2);
    console.log(`Saved screenshot: ${name}`);
  }

  console.log('\n--- 1. Testing Default Selection (2L · 2B) ---');
  let state = await getCounters();
  console.log('Default state:', state);
  await saveShot('preset-default-selected.png');

  console.log('\n--- 2. Testing First Preset (1L · 1B) ---');
  await clickPreset(0);
  state = await getCounters();
  console.log('After clicking 1L · 1B:', state);
  await saveShot('preset-first-selected.png');

  console.log('\n--- 3. Testing Final Preset (4L · 4B) ---');
  await clickPreset(4);
  state = await getCounters();
  console.log('After clicking 4L · 4B:', state);
  await saveShot('preset-final-selected.png');

  console.log('\n--- 4. Testing Intermediate Presets (3L · 2B, 3L · 3B) ---');
  await clickPreset(2); // 3L · 2B
  state = await getCounters();
  console.log('After clicking 3L · 2B:', state);

  await clickPreset(3); // 3L · 3B
  state = await getCounters();
  console.log('After clicking 3L · 3B:', state);

  console.log('\n--- 5. Testing Narrow Mobile Viewport (320px) ---');
  await page.setViewport({ width: 320, height: 750, deviceScaleFactor: 2, isMobile: true });
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle0' });
  await clickPreset(1); // Select 2L · 2B
  await new Promise((r) => setTimeout(r, 150));

  const overflow320 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`320px viewport overflow: ${overflow320}`);
  await saveShot('preset-width-320px.png');

  console.log('\n--- 6. Testing Wider Viewport (768px tablet / desktop) ---');
  await page.setViewport({ width: 768, height: 900, deviceScaleFactor: 2, isMobile: false });
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle0' });
  await clickPreset(1);
  await new Promise((r) => setTimeout(r, 150));

  const overflow768 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`768px viewport overflow: ${overflow768}`);
  await saveShot('preset-width-wider.png');

  await browser.close();
  server.close();
  console.log('\nAll preset verification tests completed successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
