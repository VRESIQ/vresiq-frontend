import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const artifactsDir = 'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\ff16161c-c039-40a5-b655-7eefd1ef94e5';
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Global mutable mock resume
const mockResume = {
  _id: 'test-id',
  title: 'Hyperlink Audit Resume',
  template: 'template1',
  profileInfo: {
    name: 'Alex Mercer',
    role: 'Lead Systems Engineer',
    targetRole: 'Principal Architect',
    summary: 'Summary with a link [Google](https://google.com) and some other details.'
  },
  contactInfo: {
    email: 'alex.mercer@gmail.com',
    phone: '+1 555-0199',
    linkedIn: 'https://linkedin.com/in/alex-mercer',
    github: 'https://github.com/alex-mercer',
    website: 'https://mercer.dev',
    location: 'San Francisco, CA'
  },
  decoratives: {
    headerStyle: 'card',
    linkStyle: 'professional',
    themeColor: '#007acc',
    bulletStyle: 'disc',
    highDensity: 'false',
    pageBorder: 'false'
  },
  workExperience: [
    {
      company: 'Tech Corp',
      position: 'Senior Dev',
      startDate: '2020-01',
      endDate: 'Present',
      description: 'Built cool stuff. Visited [GitHub](https://github.com).'
    }
  ],
  education: [],
  skills: [],
  projects: [
    {
      name: 'Project Alpha',
      description: 'Alpha project. Link: [GitHub Repo](https://github.com/alex-mercer/alpha)',
      url: 'https://github.com/alex-mercer/alpha'
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Architect',
      issuer: 'Amazon Web Services',
      url: 'https://aws.amazon.com/certification'
    }
  ],
  languages: [],
  interests: []
};

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  // Intercept API calls
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/resumes/test-id')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResume)
      });
    } else if (url.includes('/api/auth/me') || url.includes('/api/users/me') || url.includes('/api/auth/profile') || url.includes('/api/auth/refresh')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: 'alex.mercer@gmail.com', name: 'Alex Mercer', plan: 'pro' })
      });
    } else if (url.includes('/api/')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    } else {
      req.continue();
    }
  });

  const templates = [
    { id: 'template1', name: 'Standard' },
    { id: 'premium1', name: 'Prime' },
    { id: 'academic_cv', name: 'Scholar' },
    { id: 'engineer_ats', name: 'Frame' }
  ];

  const toggles = ['professional', 'standard'];
  const headerStyles = ['card', 'full-bleed'];

  console.log('Starting visual hyperlink audit...');

  // Set mock token and plan in sessionStorage/localStorage by loading main domain first
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ email: 'alex.mercer@gmail.com', plan: 'pro' }));
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  });

  for (const template of templates) {
    for (const toggle of toggles) {
      for (const hStyle of headerStyles) {
        console.log(`Auditing: Template=${template.name}, ProfessionalHyperlinks=${toggle === 'professional' ? 'ON' : 'OFF'}, HeaderStyle=${hStyle}`);

        // Update global mock resume object values before reloading
        mockResume.template = template.id;
        mockResume.decoratives.linkStyle = toggle;
        mockResume.decoratives.headerStyle = hStyle;

        // Navigate to editor
        await page.goto('http://localhost:4173/editor/test-id', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 800));

        // Capture screenshot of the resume preview container
        const previewElement = await page.$('#resume-preview');
        if (previewElement) {
          const screenshotName = `${template.id}_link_${toggle}_${hStyle}.png`;
          await previewElement.screenshot({
            path: path.join(artifactsDir, screenshotName)
          });
          console.log(`Saved screenshot: ${screenshotName}`);
        } else {
          console.log('Could not find #resume-preview element. Current URL is:', page.url());
        }
      }
    }
  }

  console.log('Hyperlink styling audit complete!');
  await browser.close();
}

run().catch(console.error);
