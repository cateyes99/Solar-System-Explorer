/** Quick visual capture of the main views, for reviewing the look. */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const OUT = 'shots'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))

await mkdir(OUT, { recursive: true })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas', { state: 'attached' })
await page.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), {
  timeout: 90_000,
})
await page.waitForTimeout(2500)
await page.keyboard.press('Escape')
await page.waitForTimeout(3000)
await page.screenshot({ path: `${OUT}/wide.png` })

// Keyboard shortcuts: 0 = Sun, 3 = Earth, 6 = Saturn, 5 = Jupiter.
for (const [key, name] of [
  ['0', 'sun'],
  ['3', 'earth'],
  ['6', 'saturn'],
  ['5', 'jupiter'],
]) {
  await page.keyboard.press(key)
  await page.waitForTimeout(9000)
  await page.screenshot({ path: `${OUT}/planet-${name}.png` })
  await page.keyboard.press('h')
  await page.waitForTimeout(7000)
}

// A couple of lesson and what-if scenes.
for (const [label, open] of [
  ['lesson-gravity', async () => {
    await page.getByRole('button', { name: 'Explore & Learn' }).first().click()
    await page.getByRole('button', { name: /^Gravity/ }).last().click()
  }],
  ['whatif-two-moons', async () => {
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'What If?' }).first().click()
    await page.getByRole('button', { name: /two moons/ }).last().click()
  }],
  ['tour-sun', async () => {
    await page.keyboard.press('Escape')
    await page.keyboard.press('t')
  }],
]) {
  await open()
  await page.waitForTimeout(9000)
  await page.screenshot({ path: `${OUT}/${label}.png` })
}

await browser.close()
console.log('done')