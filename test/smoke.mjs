import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.desktop', { timeout: 10000 });
await page.waitForTimeout(500);

const emojiAudit = await page.evaluate(() => {
  const findings = [];
  const all = document.querySelectorAll('.desktop-icon .glyph, .start-button, .taskbar-item, .app-tile, .window-titlebar .icon, .taskbar-tray');
  all.forEach((el) => {
    const svg = el.querySelector('svg.icon');
    if (!svg) findings.push({ tag: el.tagName, cls: el.className, reason: 'no svg.icon' });
  });
  return findings;
});
console.log('Icon audit findings:', emojiAudit.length, JSON.stringify(emojiAudit));

const emptyGlyphs = await page.evaluate(() => {
  const all = document.querySelectorAll('.desktop-icon .glyph, .taskbar-item, .app-tile');
  return Array.from(all).filter((el) => !el.children.length).length;
});
console.log('Empty glyphs:', emptyGlyphs);

const appOpen = async (name) => {
  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(100);
  const start = await page.$('.start-button');
  if (start) await start.click();
  await page.waitForSelector('.start-menu', { timeout: 5000 });
  await page.click(`text=${name}`);
  await page.waitForSelector('.window', { timeout: 5000 });
  const titlebarHasSvg = await page.$eval('.window-titlebar', () => !!document.querySelector('.window-titlebar svg.icon'));
  return titlebarHasSvg;
};

const closeAllWindows = async () => {
  let n = 0;
  while (n < 20) {
    const btn = await page.$('.window-titlebar .close');
    if (!btn) break;
    await btn.click();
    await page.waitForTimeout(120);
    n++;
  }
};

const apps = ['Files', 'Notepad', 'Paint', 'Calculator', 'Terminal', 'Neon Browser', 'Settings', 'System Monitor', 'About Neon OS'];
const appResults = [];
for (const app of apps) {
  try {
    const hasSvg = await appOpen(app);
    appResults.push({ app, ok: hasSvg });
    await closeAllWindows();
    await page.waitForTimeout(150);
  } catch (e) {
    appResults.push({ app, ok: false, err: e.message });
  }
}
console.log('Apps:', JSON.stringify(appResults, null, 2));

await appOpen('Calculator');
await page.click('.calculator .keys button:has-text("2")');
await page.click('.calculator .keys button:has-text("+")');
await page.click('.calculator .keys button:has-text("3")');
await page.click('.calculator .keys button:has-text("=")');
await page.waitForTimeout(200);
const calcDisplay = await page.$eval('.calculator .display', (el) => el.textContent);
console.log('Calculator 2+3 =', calcDisplay.replace(/\s+/g, ' ').trim());
await closeAllWindows();

await appOpen('Terminal');
await page.waitForSelector('.terminal .input-row input');
await page.fill('.terminal .input-row input', 'help');
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const termText = await page.$eval('.terminal .output', (el) => el.textContent);
console.log('Terminal help: first 80 chars:', termText.slice(0, 80).replace(/\s+/g, ' '));
await closeAllWindows();

await appOpen('Neon Browser');
await page.waitForSelector('.browser .bar input');
await page.fill('.browser .bar input', 'wiki:wikipedia');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const browserText = await page.$eval('.browser .page', (el) => el.textContent);
console.log('Browser first 80 chars:', browserText.slice(0, 80).replace(/\s+/g, ' '));
await closeAllWindows();

await appOpen('Notepad');
await page.waitForSelector('.notepad textarea');
await page.fill('.notepad textarea', 'Hello from playwright');
await page.waitForTimeout(150);
const notepadVal = await page.$eval('.notepad textarea', (el) => el.value);
console.log('Notepad edit:', notepadVal);
await closeAllWindows();

const before = await page.evaluate(() => localStorage.getItem('neon-os-state-v1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.desktop');
const after = await page.evaluate(() => localStorage.getItem('neon-os-state-v1'));
console.log('Persistence:', before === after, 'len=', before?.length ?? 0);

const t1 = await page.$eval('.taskbar-clock .time', (el) => el.textContent);
await page.waitForTimeout(1200);
const t2 = await page.$eval('.taskbar-clock .time', (el) => el.textContent);
console.log('Clock tick:', t1, '->', t2, 'diff:', t1 !== t2);

console.log('\n=== CONSOLE ERRORS ===');
consoleErrors.forEach((e) => console.log('  -', e));

await browser.close();
process.exit(consoleErrors.length > 0 ? 1 : 0);
