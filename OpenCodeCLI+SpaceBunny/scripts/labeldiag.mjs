import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas', { state: 'attached' })
await page.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), {
  timeout: 90_000,
})
await page.waitForTimeout(2500)
await page.keyboard.press('Escape')
await page.waitForTimeout(3000)
await page.keyboard.press('6')
await page.waitForTimeout(14000)

const labels = await page.evaluate(() =>
  [...document.querySelectorAll('div')]
    .filter((d) => d.style.transform && d.style.transform.includes('translate3d'))
    .map((d) => ({
      text: d.textContent.trim().slice(0, 30),
      transform: d.style.transform,
      opacity: d.style.opacity,
    })),
)
writeFileSync('labeldiag.json', JSON.stringify(labels, null, 2))
await page.screenshot({ path: 'shots/diag-saturn.png' })
await browser.close()