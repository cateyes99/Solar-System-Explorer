/** Capture the responsive layouts for review. */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const OUT = 'shots'
const SIZES = {
  desktop: [1920, 1080],
  laptop: [1440, 900],
  small: [1280, 720],
  tablet: [834, 1112],
  phone: [390, 844],
}

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
await mkdir(OUT, { recursive: true })

for (const [name, [width, height]] of Object.entries(SIZES)) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { state: 'attached' })
  await page.waitForFunction(
    () => !document.body.innerText.includes('Preparing the Solar System'),
    undefined,
    { timeout: 90_000 },
  )
  await page.waitForTimeout(3000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${OUT}/vp-${name}.png` })

  // One panel open, to check the overlay layout too.
  await page.getByRole('button', { name: 'Saturn', exact: true }).first().click()
  await page.waitForTimeout(5000)
  await page.screenshot({ path: `${OUT}/vp-${name}-panel.png` })
  await page.close()
}

await browser.close()
console.log('done')