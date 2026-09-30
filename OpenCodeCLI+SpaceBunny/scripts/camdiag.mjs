import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:5199'
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text())
})
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas', { state: 'attached' })
await page.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), {
  timeout: 90_000,
})
await page.waitForTimeout(2500)
await page.keyboard.press('Escape')
await page.waitForTimeout(2500)

const read = async (label) => {
  const d = await page.evaluate(() => window.__sseCam)
  console.log(label, JSON.stringify(d))
}

await read('after-intro ')
await page.keyboard.press('3')
await page.waitForTimeout(300)
await read('0.3s after 3')
await page.waitForTimeout(1500)
await read('1.8s after 3')
await page.waitForTimeout(3000)
await read('4.8s after 3')
await page.waitForTimeout(4000)
await read('8.8s after 3')

await page.keyboard.press('h')
await page.waitForTimeout(4000)
await read('after h    ')

await browser.close()
writeFileSync('camdiag.txt', 'captured')