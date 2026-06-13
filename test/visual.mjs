import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('test/screenshots', { recursive: true });

const issues = [];
const consoleErrors = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
const page = await ctx.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

const url = process.argv[2] || 'http://localhost:5173/';
console.log('Testing:', url);
const resp = await page.goto(url, { waitUntil: 'networkidle' });
console.log('Status:', resp?.status());

await page.waitForSelector('.desktop', { timeout: 10000 });
await page.waitForTimeout(500);

await page.screenshot({ path: 'test/screenshots/01-desktop.png', fullPage: false });

const tofu = await page.evaluate(() => {
  const out = [];
  const sel = 'body *:not(script):not(style)';
  document.querySelectorAll(sel).forEach((el) => {
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
    own.forEach((n) => {
      const t = n.textContent ?? '';
      for (const ch of t) {
        const cp = ch.codePointAt(0);
        if (cp === 0xFFFD) out.push({ ch, cp });
      }
    });
    const before = window.getComputedStyle(el, '::before').content;
    if (before && /[\u{1F000}-\u{1FFFF}]/u.test(before)) {
      out.push({ ch: before, where: 'before' });
    }
  });
  return out;
});
console.log('Emoji-like content in pseudo-elements:', JSON.stringify(tofu, null, 2));

const glyphReport = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('.desktop-icon .glyph, .start-button, .taskbar-item')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    out.push({
      tag: el.tagName,
      cls: el.className,
      text: (el.textContent ?? '').trim().slice(0, 8),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    });
  }
  return out;
});
console.log('Visible icons/buttons:', JSON.stringify(glyphReport, null, 2));

await page.click('.start-button');
await page.waitForSelector('.start-menu');
await page.waitForTimeout(200);
await page.screenshot({ path: 'test/screenshots/02-startmenu.png' });

const tiles = await page.$$eval('.start-menu .app-tile', (els) =>
  els.map((e) => ({ label: e.textContent?.trim() ?? '' }))
);
console.log('Start menu tiles:', tiles);

const targets = [
  { name: 'Notepad', open: async () => { await page.click('text=Notepad'); } },
  { name: 'Files', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=Files'); } },
  { name: 'Calculator', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=Calculator'); } },
  { name: 'Paint', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=Paint'); } },
  { name: 'Terminal', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=Terminal'); } },
  { name: 'Browser', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=Neon Browser'); } },
  { name: 'Settings', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=Settings'); } },
  { name: 'System Monitor', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=System Monitor'); } },
  { name: 'About', open: async () => { await page.click('.start-button'); await page.waitForSelector('.start-menu'); await page.click('text=About'); } },
];

if (await page.$('.start-menu')) await page.keyboard.press('Escape');

for (const t of targets) {
  try {
    await t.open();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test/screenshots/app-${t.name.replace(/\s+/g, '_')}.png` });
    const winTxt = await page.$eval('.window', () => document.body.innerText);
    const tofu = (winTxt.match(/[\u{FFFD}\u{25A1}\u{25A0}\u{FFFE}\u{FFFF}]/gu) ?? []).length;
    if (tofu > 0) issues.push(`${t.name}: ${tofu} replacement-glyphs in window`);
    const closeBtn = await page.$('.window-titlebar .close');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(200);
  } catch (e) {
    issues.push(`${t.name}: ${e.message}`);
  }
}

await page.click('.start-button');
await page.waitForSelector('.start-menu');
await page.click('text=Terminal');
await page.waitForSelector('.terminal .input-row input');
await page.fill('.terminal .input-row input', 'help');
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const termText = await page.$eval('.terminal .output', (el) => el.innerText);
console.log('--- Terminal `help` output (first 200 chars) ---');
console.log(termText.slice(0, 200));
if (!termText.includes('help')) issues.push('Terminal: `help` did not print expected text');
const termClose = await page.$('.window-titlebar .close');
if (termClose) await termClose.click();
await page.waitForTimeout(200);

await page.click('.start-button');
await page.waitForSelector('.start-menu');
await page.click('text=Calculator');
await page.waitForSelector('.calculator .display');
await page.click('.calculator .keys button:has-text("2")');
await page.click('.calculator .keys button:has-text("+")');
await page.click('.calculator .keys button:has-text("3")');
await page.click('.calculator .keys button:has-text("=")');
await page.waitForTimeout(200);
const calcDisplay = await page.$eval('.calculator .display', (el) => el.innerText);
console.log('Calculator display:', calcDisplay);
if (!calcDisplay.includes('5')) issues.push('Calculator: 2+3 did not produce 5');
const calcClose = await page.$('.window-titlebar .close');
if (calcClose) await calcClose.click();
await page.waitForTimeout(200);

await page.click('.start-button');
await page.waitForSelector('.start-menu');
await page.click('text=Neon Browser');
await page.waitForSelector('.browser .bar input');
await page.fill('.browser .bar input', 'wiki:wikipedia');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const browserText = await page.$eval('.browser .page', (el) => el.innerText);
console.log('Browser first 100 chars:', browserText.slice(0, 100));
if (!browserText.toLowerCase().includes('wikipedia')) issues.push('Browser: wiki:wikipedia did not load');
const browserClose = await page.$('.window-titlebar .close');
if (browserClose) await browserClose.click();
await page.waitForTimeout(200);

await page.click('.start-button');
await page.waitForSelector('.start-menu');
await page.click('text=Notepad');
await page.waitForSelector('.notepad textarea');
await page.fill('.notepad textarea', 'Hello from playwright');
await page.waitForTimeout(200);
const notepadVal = await page.$eval('.notepad textarea', (el) => el.value);
if (!notepadVal.includes('Hello from playwright')) issues.push('Notepad: edit did not stick');
const notepadClose = await page.$('.window-titlebar .close');
if (notepadClose) await notepadClose.click();
await page.waitForTimeout(200);

const beforeReload = await page.evaluate(() => localStorage.getItem('neon-os-state-v1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.desktop');
await page.waitForTimeout(500);
const afterReload = await page.evaluate(() => localStorage.getItem('neon-os-state-v1'));
if (beforeReload !== afterReload) issues.push('Persistence: localStorage changed after reload');

const t1 = await page.$eval('.taskbar-clock .time', (el) => el.textContent);
await page.waitForTimeout(1200);
const t2 = await page.$eval('.taskbar-clock .time', (el) => el.textContent);
if (t1 === t2) issues.push('Clock: did not tick');

const tray = await page.$eval('.taskbar-tray', (el) => el.textContent);
console.log('Tray text:', tray);

console.log('\n=== ISSUES ===');
for (const i of issues) console.log('-', i);
console.log('\n=== CONSOLE ERRORS ===');
for (const e of consoleErrors) console.log('-', e);

await browser.close();
process.exit(issues.length + consoleErrors.length > 0 ? 1 : 0);
