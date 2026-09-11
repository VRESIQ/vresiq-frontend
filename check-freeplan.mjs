import { chromium } from 'playwright';

const RID = '6a5bca78de32f7b3405098df';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@vresiq.com');
await page.fill('input[type="password"]', 'admin2026@vresiq2026');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 20000 });

await page.goto(`http://localhost:5173/resume/${RID}/edit`, { waitUntil: 'networkidle' });
await page.waitForSelector('#resume-preview', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const data = await page.evaluate(() => {
  // Find the ResumePreview React fiber to inspect props
  const article = document.getElementById('resume-preview');
  const fiberKey = Object.keys(article).find(k => k.startsWith('__reactFiber'));
  const fiber = article[fiberKey];

  // Walk up to find ResumePreview component
  let current = fiber;
  let resumePreviewProps = null;
  while (current && !resumePreviewProps) {
    if (current.type?.name === 'ResumePreview' ||
        current.memoizedProps?.isFreePlan !== undefined) {
      resumePreviewProps = current.memoizedProps;
      break;
    }
    current = current.return;
  }

  return {
    isFreePlan: resumePreviewProps?.isFreePlan,
    propsFound: !!resumePreviewProps,
  };
});

console.log('React Props:', JSON.stringify(data, null, 2));

// Also check user subscription from API
const user = await page.evaluate(async () => {
  const t = sessionStorage.getItem('token');
  const r = await fetch('/api/auth/user', { headers: { Authorization: 'Bearer ' + t } });
  if (!r.ok) return { error: r.status };
  const u = await r.json();
  return {
    subscriptionPlan: u.subscriptionPlan,
    email: u.email,
  };
});

console.log('User API:', JSON.stringify(user, null, 2));

await browser.close();
