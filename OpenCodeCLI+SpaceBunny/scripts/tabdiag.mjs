import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas')
await page.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), {
  timeout: 60_000,
})
await page.waitForTimeout(2000)
await page.keyboard.press('Escape')
await page.waitForTimeout(1500)

const order = []
for (let i = 0; i < 8; i += 1) {
  await page.keyboard.press('Tab')
  order.push(
    await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return 'none'
      return `${el.tagName}.${String(el.className).slice(0, 40)} :: ${(el.textContent ?? '').trim().slice(0, 40)}`
    }),
  )
}

const domOrder = await page.evaluate(() => {
  const focusables = [
    ...document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ]
  return focusables.slice(0, 8).map((el) => `${el.tagName}.${String(el.className).slice(0, 30)}`)
})

writeFileSync('tabdiag.txt', `tab order:\n${order.join('\n')}\n\nDOM order:\n${domOrder.join('\n')}\n`)
await browser.close()