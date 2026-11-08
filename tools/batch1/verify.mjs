/**
 * Batch 1 verification: internship URL + independent Training section.
 * Drives the real editor UI (real ResumeEditor / ResumePreview) with the
 * backend HTTP surface stubbed, then captures the exact export HTML that the
 * app POSTs to /export-pdf for real PDF generation.
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5180';
const RID = 'batch1testresume000001';
const OUT = 'tools/batch1/out';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
};

const baseResume = {
  _id: RID,
  title: 'Batch 1 Test',
  template: 'template1',
  fontPairing: null,
  decoratives: {
    sectionVisibility: JSON.stringify({ internships: true }),
    sectionBullets: '{}',
  },
  profileInfo: { fullName: 'Batch One', designation: 'Backend Developer', summary: '', ProfilePreviewUrl: '' },
  contactInfo: { email: 'batch1@example.com', phone: '+15550100', location: 'New York, NY', linkedIn: '', github: '', website: '', leetCode: '', hackerRank: '' },
  workExperience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [],
  customSections: {
    internships: [{
      title: 'Software Engineering Intern',
      subtitle: 'Acme Cloud',
      date: 'June 2025 - August 2025',
      description: 'Built internal deployment tooling.',
      url: 'https://acme.example.com/cert/123',
    }],
  },
};

const user = { id: 'u1', name: 'Batch Tester', email: 'batch1@vresiq.local', subscriptionPlan: 'free', emailVerified: true };
let serverResume = baseResume;
let savedPayload = null;
let exportHtml = null;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 200)); });

await page.addInitScript(() => sessionStorage.setItem('token', 'batch1-token'));
await page.route('**/*', async (route) => {
  const req = route.request();
  const u = new URL(req.url());
  if (!u.pathname.startsWith('/api/')) return route.continue();
  if (u.pathname === '/api/auth/profile') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
  if (u.pathname === `/api/resumes/${RID}` && req.method() === 'GET')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(serverResume) });
  if (u.pathname === `/api/resumes/${RID}` && req.method() === 'PUT') {
    savedPayload = JSON.parse(req.postData() || '{}');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...savedPayload, _id: RID }) });
  }
  if (u.pathname.endsWith('/export-pdf')) {
    try { exportHtml = JSON.parse(req.postData()).htmlContent; } catch { /* ignore */ }
    return route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4 stub' });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});

const gotoEditor = async () => {
  await page.goto(`${BASE}/resume/${RID}/edit`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#resume-preview', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
};

const rx = (s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
const nav = (label) => page.locator('.sidebar-btn', { hasText: rx(label) });
const fieldByLabel = (label) =>
  page.locator('.field', { has: page.locator('label', { hasText: rx(label) }) }).first();

const previewText = () => page.locator('#resume-preview').innerText();
const sectionOrderInPreview = async () =>
  page.$$eval('#resume-preview .rp-stitle', (els) => els.map((e) => e.innerText.trim()));

await gotoEditor();

// ── 1. Existing internship record + new URL field ───────────────────────────
await nav('Internships').click();
await page.waitForTimeout(400);
const internRole = await fieldByLabel('Internship Role').locator('input').inputValue();
const internUrlField = fieldByLabel('Relevant URL (optional)');
const internUrlValue = await internUrlField.locator('input').inputValue();
check('existing internship record loads', internRole === 'Software Engineering Intern', internRole);
check('internship URL field is present and hydrated', internUrlValue === 'https://acme.example.com/cert/123', internUrlValue);

const previewBefore = await previewText();
const anchorBefore = await page.locator('#resume-preview a.rp-custom-url').first().getAttribute('href');
check('internship URL renders in preview', previewBefore.includes('acme.example.com/cert/123'), 'text present');
check('internship URL is an anchor', anchorBefore === 'https://acme.example.com/cert/123', String(anchorBefore));

// ── 2. Enable the independent Training section ──────────────────────────────
const trainingNavBefore = await nav('Training').count();
check('Training is not present before enabling', trainingNavBefore === 0, `count=${trainingNavBefore}`);

await nav('Section Layout').click();
await page.waitForTimeout(300);
await page.locator('.decoratives-section button', { has: page.locator('span', { hasText: rx('Training') }) }).first().click();
await page.waitForTimeout(500);
check('Training becomes available in navigation', (await nav('Training').count()) === 1, 'single nav entry');

const trainingToggleText = await page
  .locator('.decoratives-section button', { has: page.locator('span', { hasText: rx('Training') }) })
  .first().innerText();
check('Training shows as enabled in Section Layout', /Enabled/.test(trainingToggleText), trainingToggleText.replace(/\n/g, ' '));

// ── 3. Add a training entry through the form ────────────────────────────────
await nav('Training').click();
await page.waitForTimeout(400);
await page.locator('.editor-section .btn-add').first().click();
await page.waitForTimeout(500);

await fieldByLabel('Training / Course Name').locator('input').fill('Advanced Java Programming');
await fieldByLabel('Training Provider / Institution').locator('input').fill('NPTEL');
await fieldByLabel('Training Dates / Duration').locator('input').fill('January 2026 - March 2026');
await fieldByLabel('Key Skills & Learnings').locator('textarea').fill('Java, OOP, Collections, Multithreading');
const trainingUrlInput = fieldByLabel('Relevant URL (optional)').locator('input');
await trainingUrlInput.fill('nptel.ac.in/cert/abc');
await trainingUrlInput.blur();
await page.waitForTimeout(600);

const normalizedUrl = await trainingUrlInput.inputValue();
check('bare domain is normalized to https', normalizedUrl === 'https://nptel.ac.in/cert/abc', normalizedUrl);

const previewAfter = await previewText();
check('training name in preview', previewAfter.includes('Advanced Java Programming'));
check('training provider in preview', previewAfter.includes('NPTEL'));
check('training dates in preview (formatted)', /jan[a-z]*\.?\s*2026/i.test(previewAfter) && /mar[a-z]*\.?\s*2026/i.test(previewAfter), previewAfter.split('\n').find((l) => /2026/i.test(l)) || '');
check('training skills in preview', previewAfter.includes('Collections'));
check('training URL in preview', previewAfter.includes('nptel.ac.in/cert/abc'));
check('training URL is an anchor', (await page.locator('#resume-preview a[href="https://nptel.ac.in/cert/abc"]').count()) === 1);
const headings = (await sectionOrderInPreview()).map((s) => s.toLowerCase());
check('training has its own section heading', headings.includes('training'), (await sectionOrderInPreview()).join(' | '));

// ── 4. Bullet toggle parity with Internships ────────────────────────────────
const ulBefore = await page.locator('#resume-preview section', { has: page.locator('h3', { hasText: /^Training$/ }) }).locator('ul.rp-custom-list').count();
check('training renders bullet list by default', ulBefore === 1, `ul=${ulBefore}`);
await page.locator('#bullets-toggle-training').uncheck();
await page.waitForTimeout(500);
const ulAfter = await page.locator('#resume-preview section', { has: page.locator('h3', { hasText: /^Training$/ }) }).locator('ul.rp-custom-list').count();
const divAfter = await page.locator('#resume-preview section', { has: page.locator('h3', { hasText: /^Training$/ }) }).locator('div.rp-custom-list').count();
check('training bullets can be turned off', ulAfter === 0 && divAfter === 1, `ul=${ulAfter} div=${divAfter}`);
await page.locator('#bullets-toggle-training').check();
await page.waitForTimeout(400);

// ── 4b. Multiple entries + entry without a URL ────────────────────────────
await page.locator('.editor-section .btn-add').first().click();
await page.waitForTimeout(500);
const cards = page.locator('.editor-section .list-card');
const secondCard = cards.nth(1);
await secondCard.locator('.field', { has: page.locator('label', { hasText: rx('Training / Course Name') }) }).locator('input').fill('Cloud Fundamentals');
await secondCard.locator('.field', { has: page.locator('label', { hasText: rx('Training Provider / Institution') }) }).locator('input').fill('Coursera');
await page.waitForTimeout(600);
check('multiple training entries supported', (await cards.count()) === 2, `cards=${await cards.count()}`);
const previewMulti = await previewText();
check('second training entry renders in preview', previewMulti.includes('Cloud Fundamentals') && previewMulti.includes('Coursera'));
check('URL-less training entry adds no link', previewMulti.includes('nptel.ac.in/cert/abc') && (await page.locator('#resume-preview a.rp-custom-url').count()) === 2, `urlLinks=${await page.locator('#resume-preview a.rp-custom-url').count()}`);
await secondCard.locator('.btn-remove').click();
await page.waitForTimeout(600);
check('training entry removal works', (await cards.count()) === 1, `cards=${await cards.count()}`);
check('removed entry disappears from preview', !(await previewText()).includes('Cloud Fundamentals'));

// ── 5. Reordering in Section Visibility & Order ─────────────────────────────
await nav('Section Layout').click();
await page.waitForTimeout(400);
const orderBefore = (await page.$$eval('.section-order-item', (els) => els.map((e) => e.innerText.split('\n')[0].trim())));
const trainingRow = page.locator('.section-order-item', { hasText: /^Training/ }).first();
await trainingRow.locator('button').first().click();
await page.waitForTimeout(500);
const orderAfter = (await page.$$eval('.section-order-item', (els) => els.map((e) => e.innerText.split('\n')[0].trim())));
check('Training appears in Section Visibility & Order', orderBefore.some((t) => t.startsWith('Training')), orderBefore.join(' | '));
check('Training can be reordered', orderBefore.join() !== orderAfter.join(), `${orderBefore.indexOf(orderBefore.find(t => t.startsWith('Training')))} -> ${orderAfter.indexOf(orderAfter.find(t => t.startsWith('Training')))}`);

// ── 6. Save payload carries both URLs and the training array ────────────────
await page.waitForTimeout(2500); // autosave debounce
const saved = savedPayload || {};
const savedInternshipUrl = saved?.customSections?.internships?.[0]?.url;
const savedTraining = saved?.customSections?.training?.[0];
check('save payload includes internship url', savedInternshipUrl === 'https://acme.example.com/cert/123', String(savedInternshipUrl));
check('save payload includes training entry', !!savedTraining, savedTraining ? savedTraining.title : 'missing');
check('save payload includes training url', savedTraining?.url === 'https://nptel.ac.in/cert/abc', String(savedTraining?.url));
check('training is a separate customSections key', !!saved?.customSections?.training && !!saved?.customSections?.internships);
let savedVisibility = {};
try { savedVisibility = JSON.parse(saved?.decoratives?.sectionVisibility || '{}'); } catch { /* ignore */ }
check('sectionVisibility persists training=true', savedVisibility.training === true, JSON.stringify(savedVisibility));

// ── 7. Reload from the saved payload (persistence contract) ─────────────────
if (savedPayload) serverResume = { ...savedPayload, _id: RID };
await gotoEditor();
await nav('Training').click();
await page.waitForTimeout(500);
const reloadName = await fieldByLabel('Training / Course Name').locator('input').inputValue();
const reloadUrl = await fieldByLabel('Relevant URL (optional)').locator('input').inputValue();
check('training survives reload', reloadName === 'Advanced Java Programming', reloadName);
check('training URL survives reload', reloadUrl === 'https://nptel.ac.in/cert/abc', reloadUrl);
await nav('Internships').click();
await page.waitForTimeout(400);
check('internship URL survives reload', (await fieldByLabel('Relevant URL (optional)').locator('input').inputValue()) === 'https://acme.example.com/cert/123');

// ── 8. Export HTML (exact payload sent to the PDF generator) ────────────────
await page.evaluate(async () => { try { await window.getPDFBlob(); } catch { /* stubbed */ } });
await page.waitForTimeout(600);
check('export HTML captured', !!exportHtml, exportHtml ? `${exportHtml.length} bytes` : 'none');
if (exportHtml) {
  fs.writeFileSync(`${OUT}/export-batch1.html`, exportHtml);
  check('export HTML contains training section', exportHtml.includes('Training') && exportHtml.includes('Advanced Java Programming'));
  check('export HTML contains training URL href', exportHtml.includes('href="https://nptel.ac.in/cert/abc"'));
  check('export HTML contains internship URL href', exportHtml.includes('href="https://acme.example.com/cert/123"'));
}

await page.locator('#resume-preview').screenshot({ path: `${OUT}/preview-batch1.png` });
await page.screenshot({ path: `${OUT}/editor-batch1.png`, fullPage: false });

check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' || '));

fs.writeFileSync(`${OUT}/verify-results.json`, JSON.stringify({ results, passed: results.filter(r => r.pass).length, total: results.length, pageErrors }, null, 2));
console.log(`\n${results.filter(r => r.pass).length}/${results.length} checks passed`);
await browser.close();
process.exit(results.every((r) => r.pass) ? 0 : 1);
