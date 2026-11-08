import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5181';
const OUT = 'tools/batch2/out';
mkdirSync(OUT, { recursive: true });

const RID = 'batch2testresume00001';
const resume = {
  _id: RID, title: 'Senior Frontend Engineer', template: 'template1', createdAt: new Date().toISOString(),
  decoratives: { sectionVisibility: JSON.stringify({ summary: true, education: true, skills: true, projects: true, certifications: true, internships: true }), sectionBullets: '{}' },
  profileInfo: { fullName: 'Alex Morgan', designation: 'Senior Frontend Engineer', summary: 'Frontend engineer with 8 years building design systems and data-heavy dashboards.' },
  contactInfo: { email: 'alex.morgan@example.com', phone: '+1 555 0100', location: 'New York, NY', website: 'alexmorgan.dev' },
  workExperience: [{ title: 'Senior Frontend Engineer', company: 'Northwind', date: '2021 - Present', description: 'Led design system migration to React 18.\nCut bundle size 38% with route-level code splitting.' }],
  education: [{ degree: 'B.Tech Computer Science', institution: 'State University', date: '2012 - 2016', description: 'GPA 3.8' }],
  skills: [{ category: 'Engineering', items: 'React, TypeScript, CSS' }],
  projects: [{ title: 'Resume Analytics', description: 'Privacy-first analytics for job seekers.' }],
  certifications: [{ title: 'AWS Solutions Architect', issuer: 'Amazon', date: '2023' }],
  customSections: { internships: [{ title: 'Software Engineering Intern', subtitle: 'Acme Cloud', date: 'June 2025 - August 2025', description: 'Built internal deployment tooling.', url: 'https://acme.example.com/cert/123' }] },
  decorativesOrder: '',
};

const list = [resume];

async function stub(page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const p = url.pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (p === '/api/auth/profile') return json({ id: 'u1', name: 'Alex Morgan', email: 'alex.morgan@example.com', subscriptionPlan: 'premium', emailVerified: true, createdAt: '2024-01-01' });
    if (p === '/api/resumes' && route.request().method() === 'GET') return json(list);
    if (p === `/api/resumes/${RID}`) return json(resume);
    if (p === '/api/resumes/usage' || p === '/api/resumes/count') return json({ used: 1, limit: 999 });
    return json({});
  });
}

const results = [];
const record = (name, value) => results.push({ name, value });

async function computed(page, selector, prop = 'backgroundColor') {
  return page.evaluate(({ selector, prop }) => {
    const el = document.querySelector(selector);
    if (!el) return 'MISSING';
    return getComputedStyle(el)[prop];
  }, { selector, prop });
}

function classify(rgb) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
  if (!m) return { rgb, neutral: null };
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return { rgb, rgbArr: [r, g, b], spread, neutral: spread <= 6 };
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.addInitScript(() => sessionStorage.setItem('token', 'test-token'));
await stub(page);

async function setTheme(theme) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('vresiq-theme', t), theme);
  await page.reload({ waitUntil: 'networkidle' });
}

// ── LIGHT: landing ────────────────────────────────────────────────────────
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('vresiq-theme', 'light'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/light-landing.png` });
record('landing body bg', classify(await computed(page, 'body')));
record('landing nav bg', classify(await computed(page, '.home-nav')));
record('landing heading color', await computed(page, 'h1', 'color'));

// ── LIGHT: dashboard ──────────────────────────────────────────────────────
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/light-dashboard.png` });
record('theme attribute', await page.evaluate(() => document.documentElement.getAttribute('data-theme')));
record('dashboard root bg', classify(await computed(page, '.premium-shell')));
record('dashboard --paper', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()));
record('dashboard --wash', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--wash').trim()));
record('dashboard --line', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--line').trim()));
record('resume card bg', classify(await computed(page, '.resume-card')));
record('resume thumb bg', classify(await computed(page, '.resume-thumb-wrap')));
record('nav plan badge bg', classify(await computed(page, '.nav-plan')));

// ── LIGHT: editor (default), Section Layout, Customization, ATS Refine ────
await page.goto(`${BASE}/resume/${RID}/edit`, { waitUntil: 'networkidle' });
await page.waitForSelector('#resume-preview');
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/light-editor.png` });
record('editor body bg', classify(await computed(page, 'body')));
record('editor sidebar bg', classify(await computed(page, '.editor-sidebar')));
record('editor preview panel bg', classify(await computed(page, '.editor-preview-panel')));
record('editor input bg', classify(await computed(page, '.field input')));
record('editor input border', await computed(page, '.field input', 'borderTopColor'));

for (const [label, file] of [['Section Layout', 'light-section-layout'], ['Customization', 'light-customization'], ['ATS Refine', 'light-ats-refine']]) {
  const btn = page.locator('.sidebar-btn', { hasText: new RegExp(`^${label}$`) }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/${file}.png` });
    record(`${label} panel bg`, classify(await computed(page, '.editor-section')));
    record(`${label} input bg`, classify(await computed(page, '.editor-section input[type="text"], .editor-section .field input')));
  }
}

// preview page (print document must stay white)
await page.goto(`${BASE}/resume/${RID}`, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1200);
record('document view body bg', classify(await computed(page, 'body')));

// ── DARK: dashboard + editor ──────────────────────────────────────────────
await setTheme('dark');
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1300);
await page.screenshot({ path: `${OUT}/dark-dashboard.png` });
record('dark theme attribute', await page.evaluate(() => document.documentElement.getAttribute('data-theme')));
record('dark dashboard root bg', classify(await computed(page, '.premium-shell')));
record('dark resume card bg', classify(await computed(page, '.resume-card')));
record('dark --ink', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()));
record('dark --paper', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()));

await page.goto(`${BASE}/resume/${RID}/edit`, { waitUntil: 'networkidle' });
await page.waitForSelector('#resume-preview');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/dark-editor.png` });
record('dark editor body bg', classify(await computed(page, 'body')));
record('dark editor sidebar bg', classify(await computed(page, '.editor-sidebar')));

// ── Persistence: reload keeps dark, toggle keeps choice ──────────────────
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
record('dark persists after reload', await page.evaluate(() => document.documentElement.getAttribute('data-theme')));
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const toggle = page.locator('#theme-toggle').first();
if (await toggle.count()) {
  await toggle.click();
  await page.waitForTimeout(500);
  record('toggle switches to light', await page.evaluate(() => document.documentElement.getAttribute('data-theme')));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  record('light choice persists after reload', await page.evaluate(() => document.documentElement.getAttribute('data-theme')));
  record('localStorage vresiq-theme', await page.evaluate(() => localStorage.getItem('vresiq-theme')));
}

// ── Mobile light dashboard ───────────────────────────────────────────────
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => localStorage.setItem('vresiq-theme', 'light'));
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1300);
await page.screenshot({ path: `${OUT}/light-dashboard-mobile.png`, fullPage: false });
record('mobile overflow (px)', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));

// ── Modal in light mode ──────────────────────────────────────────────────
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const create = page.locator('button', { hasText: /Create|New Resume|Blank/i }).first();
if (await create.count()) {
  await create.click();
  await page.waitForTimeout(800);
  if (await page.locator('.modal').count()) {
    await page.screenshot({ path: `${OUT}/light-modal.png` });
    record('modal bg', classify(await computed(page, '.modal')));
    record('modal input bg', classify(await computed(page, '.modal input[type="text"]')));
  }
}

record('page errors', errors);
writeFileSync(`${OUT}/theme-results.json`, JSON.stringify(results, null, 2));
for (const r of results) console.log(`${r.name}:`, typeof r.value === 'object' ? JSON.stringify(r.value) : r.value);
await browser.close();
