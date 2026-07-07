import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Navigating to http://localhost:5173/test-preview...");
  await page.goto('http://localhost:5173/test-preview');
  
  // Wait for the resume preview to render
  await page.waitForSelector('.resume-preview');
  
  console.log("Checking elements...");
  const emailLink = await page.waitForSelector('.rp-contact-link-email');
  const sidebarHeader = await page.waitForSelector('.rp-sidebar-header');
  const sidebarName = await page.waitForSelector('.rp-sidebar-name');
  const sidebarRole = await page.waitForSelector('.rp-sidebar-role');
  
  // Evaluate the computed style
  const linkStyles = await page.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      textDecoration: computed.textDecoration,
    };
  }, emailLink);
  
  const headerStyles = await page.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
    };
  }, sidebarHeader);

  const nameStyles = await page.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
    };
  }, sidebarName);

  const roleStyles = await page.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
    };
  }, sidebarRole);
  
  console.log("Computed styles of email link:", linkStyles);
  console.log("Computed styles of sidebar header:", headerStyles);
  console.log("Computed styles of sidebar name:", nameStyles);
  console.log("Computed styles of sidebar role:", roleStyles);
  
  await browser.close();
}

main().catch(console.error);
