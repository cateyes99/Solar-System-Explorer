// Temporary deep interaction sweep: exercises every UI flow and records console errors.
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174/';
const errors = [];
const warnings = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
  if (msg.type() === 'warning') warnings.push(msg.text());
});
page.on('pageerror', (error) => errors.push(String(error)));

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`ok: ${name}`);
  } catch (error) {
    console.log(`FAIL: ${name}: ${error.message.split('\n')[0]}`);
    // Escape twice so a stuck panel can't cascade into later steps.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }
};

const waitGone = async (selector, timeout = 6000) => {
  await page.locator(selector).waitFor({ state: 'detached', timeout });
};

await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

await step('welcome loads', async () => {
  await page.locator('button:has-text("Begin exploring")').waitFor({ state: 'visible', timeout: 20000 });
});
await page.locator('button:has-text("Begin exploring")').click();
await page.waitForTimeout(1500);

await step('spacecraft mode + mission control', async () => {
  await page.locator('nav button:has-text("Spacecraft")').click();
  await page.locator('[aria-label="Mission Control"]').waitFor({ state: 'visible', timeout: 5000 });
  // fly to a destination and ride an orbit
  await page.locator('[aria-label="Mission Control"] button:has-text("Mars")').first().click();
  await page.waitForTimeout(1200);
  await page.locator('[aria-label="Flight controls"] button:has-text("Thrust")').click({ force: true });
  await page.waitForTimeout(600);
  await page.locator('[aria-label="Leave the spacecraft"]').click();
  await waitGone('[aria-label="Mission Control"]');
});

await step('every lesson opens', async () => {
  await page.locator('nav button:has-text("Explore & Learn")').click();
  await page.locator('[aria-label="Lessons"]').waitFor({ state: 'visible', timeout: 5000 });
  const lessons = await page.locator('[aria-label="Lessons"] button').all();
  console.log(`   lessons found: ${lessons.length}`);
  if (lessons.length !== 8) throw new Error(`expected 8 lessons, got ${lessons.length}`);
  for (const lesson of lessons) {
    await lesson.click();
    await page.waitForTimeout(400);
  }
  await page.locator('[aria-label="Close Explore and Learn"]').click();
  await waitGone('[role="dialog"][aria-label="Explore and Learn"]');
});

await step('every what-if scenario toggles', async () => {
  await page.locator('nav button:has-text("What If?")').click();
  await page.locator('[role="dialog"][aria-label="What If mode"]').waitFor({ state: 'visible', timeout: 5000 });
  const dialog = page.locator('[role="dialog"][aria-label="What If mode"]');
  const switches = await dialog.locator('input[type="checkbox"]').all();
  console.log(`   scenarios found: ${switches.length}`);
  if (switches.length !== 4) throw new Error(`expected 4 scenarios, got ${switches.length}`);
  for (const box of switches) {
    await box.check();
    await page.waitForTimeout(600);
    if (!(await box.isChecked())) throw new Error('switch did not turn on');
  }
  await dialog.locator('button:has-text("Reset all simulations")').click();
  await page.waitForTimeout(500);
  await dialog.locator('[aria-label="Close What If mode"]').last().click();
  await waitGone('[role="dialog"][aria-label="What If mode"]');
});

await step('cinematic tour runs', async () => {
  await page.locator('nav button:has-text("Cinematic Tour")').click();
  await page.waitForTimeout(2500);
  let skips = 0;
  for (let i = 0; i < 16; i += 1) {
    const skip = page.locator('[aria-label="Skip to the next tour stage"]');
    if (!(await skip.count())) break;
    await skip.click();
    skips += 1;
    await page.waitForTimeout(900);
  }
  console.log(`   skips performed: ${skips}`);
  const exit = page.locator('[aria-label="Exit the cinematic tour"]');
  if (await exit.count()) await exit.click();
  await waitGone('[aria-label="Exit the cinematic tour"]', 10000);
});

await step('speed + time controls', async () => {
  await page.locator('[aria-label="Pause simulation"]').click();
  await page.waitForTimeout(300);
  await page.locator('[aria-label="Play simulation"]').click();
  await page.waitForTimeout(300);
  for (const speed of ['Slow', 'Normal', 'Fast', 'Very Fast', 'Epic']) {
    await page.locator(`[aria-label="Simulation speed"] button:has-text("${speed}")`).first().click();
    await page.waitForTimeout(250);
  }
  const advance = page.locator('[aria-label="Advance time"] button');
  const n = await advance.count();
  for (let i = 0; i < n; i += 1) {
    await advance.nth(i).click();
    await page.waitForTimeout(300);
  }
  await page.locator('[aria-label="Simulation speed"] button:has-text("Normal")').first().click();
});

await step('settings panel', async () => {
  await page.locator('nav button:has-text("Settings")').click();
  await page.locator('[aria-label="Settings"]').waitFor({ state: 'visible', timeout: 5000 });
  const toggles = await page.locator('[aria-label="Settings"] input[type="checkbox"]').all();
  console.log(`   toggles: ${toggles.length}`);
  for (const t of toggles) {
    await t.click({ force: true });
    await page.waitForTimeout(300);
    await t.click({ force: true });
    await page.waitForTimeout(300);
  }
  const selects = await page.locator('[aria-label="Settings"] select').all();
  for (const s of selects) {
    const opts = await s.locator('option').all();
    for (let i = 0; i < opts.length; i += 1) {
      await s.selectOption({ index: i });
      await page.waitForTimeout(300);
    }
  }
  await page.locator('[aria-label="Close settings"]').click();
  await waitGone('[aria-label="Settings"]');
});

await step('random fact card', async () => {
  await page.locator('nav button:has-text("Teach Me Something!")').click();
  await page.locator('[aria-label="Astronomy fact"]').waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(900);
  await page.locator('[aria-label="Astronomy fact"] button:has-text("Close")').click();
  await waitGone('[aria-label="Astronomy fact"]');
});

await step('labels select bodies + panel actions', async () => {
  const labels = page.locator('.body-label');
  const count = await labels.count();
  console.log(`   body labels: ${count}`);
  if (count < 8) throw new Error(`expected labels, got ${count}`);
  for (let i = 0; i < Math.min(count, 6); i += 1) {
    await labels.nth(i).click({ force: true });
    await page.waitForTimeout(700);
    const viewBtn = page.locator('aside button:has-text("View planet")');
    if (await viewBtn.count()) await viewBtn.click();
    await page.waitForTimeout(900);
    const followBtn = page.locator('aside button:has-text("Follow")');
    if (await followBtn.count()) await followBtn.click();
    await page.waitForTimeout(900);
    const sysBtn = page.locator('aside button:has-text("System view")');
    if (await sysBtn.count()) await sysBtn.click();
    await page.waitForTimeout(900);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
});

await step('keyboard shortcuts', async () => {
  for (const key of ['0', '1', '2', '3', '4', '5', '6', '7', '8']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(700);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await page.keyboard.press('/');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('?');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('h');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('l');
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.keyboard.press('o');
  await page.waitForTimeout(600);
});

await step('final state is clean', async () => {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    mission: document.querySelectorAll('[aria-label="Mission Control"]').length,
    labels: document.querySelectorAll('.body-label').length,
  }));
  console.log('FINAL STATE:', JSON.stringify(state));
  if (state.dialogs !== 0 || state.mission !== 0) throw new Error(`unexpected state ${JSON.stringify(state)}`);
});

await page.waitForTimeout(2000);
console.log('ERRORS:', JSON.stringify(errors, null, 2));
console.log('WARNINGS:', JSON.stringify(warnings, null, 2));
console.log('PROBLEMS:', errors.length);

await browser.close();
