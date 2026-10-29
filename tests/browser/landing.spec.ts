import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('signup handles loading, success, server failure and rate limits', async ({page}) => {
 await page.goto('/');
 const input=page.getByRole('textbox',{name:'Email address'}).first();
 const submit=page.getByRole('button',{name:'Join waitlist',exact:true}).first();
 await input.fill('slow@example.test');await submit.click();
 await expect(submit).toBeDisabled();await expect(submit).toHaveText('Joining…');
 await expect(page.getByText("You're on the list! We'll email you when early access is available.")).toBeVisible();await expect(input).toHaveValue('');
 await input.fill('fail@example.test');await submit.click();
 await expect(page.getByText('We couldn’t confirm your signup. Please try again in a moment.')).toBeVisible();await expect(input).toHaveValue('fail@example.test');
 await input.fill('rate@example.test');await submit.click();
 await expect(page.getByText('Too many attempts. Please wait a minute and try again.')).toBeVisible();await expect(submit).toBeEnabled();
});

test('labels, keyboard skip navigation and feedback are accessible', async ({page}) => {
 await page.goto('/');await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'Skip to content',exact:true})).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused();
 const input=page.getByRole('textbox',{name:'Email address'}).first();await input.fill('invalid');await input.press('Enter');
 await expect(input).toHaveAttribute('aria-invalid','true');
 await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
 await page.getByRole('button',{name:'Budgets',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.getByText('Category budgets',{exact:true})).toBeVisible();
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(results.violations).toEqual([]);
});

for (const width of [320,375,768,1280]) {
 test(`layout fits ${width}px and preserves navigation`,async ({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.getByRole('navigation',{name:'Primary'}).getByRole('link',{name:'Features'})).toBeVisible();
  const bounds=await page.locator('.phone').boundingBox();expect(bounds).not.toBeNull();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  for (const input of await page.getByRole('textbox',{name:'Email address'}).all()) { const b=await input.boundingBox();expect(b!.x+b!.width).toBeLessThanOrEqual(width+1); }
 });
}

test('content reflows at 200 percent CSS zoom', async ({page})=>{
 await page.setViewportSize({width:1280,height:900});await page.goto('/');await page.evaluate(()=>{document.documentElement.style.zoom='2';});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
 await expect(page.getByRole('textbox',{name:'Email address'}).first()).toBeVisible();
});

test('initial content and removal instructions work without JavaScript',async ({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('http://127.0.0.1:8770/');await expect(page.getByRole('heading',{name:'Shared finances, simplified.'})).toBeVisible();
 await expect(page.getByRole('link',{name:'email us to request early-access updates'})).toHaveAttribute('href',/mailto:/);
 await page.getByRole('link',{name:'Leave the waitlist'}).click();await expect(page.getByRole('heading',{name:'Leave the waitlist'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Request removal by email'})).toHaveAttribute('href',/mailto:/);
 await context.close();
});

test('optional analytics has an explicit choice and does not block signup',async ({page})=>{
 await page.goto('/');await expect(page.getByText('Analytics stays off until you choose.')).toBeVisible();
 await page.getByRole('button',{name:'No thanks',exact:true}).click();await page.reload();
 await expect(page.getByText('Optional analytics disabled.')).toBeVisible();
 await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
 await expect(page.getByText('Optional analytics enabled.')).toBeVisible();
});
