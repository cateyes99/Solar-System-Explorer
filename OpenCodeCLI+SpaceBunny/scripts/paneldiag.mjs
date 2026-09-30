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
await page.waitForTimeout(2000)
await page.keyboard.press('Escape')
await page.waitForTimeout(1000)
await page.getByRole('button', { name: 'Saturn', exact: true }).first().click()
await page.waitForTimeout(1500)

const info = await page.evaluate(() => {
  const aside = document.querySelector('aside')
  if (!aside) return { missing: true }
  const rect = aside.getBoundingClientRect()
  const cs = getComputedStyle(aside)
  const parent = aside.parentElement
  return {
    rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    position: cs.position,
    right: cs.right,
    left: cs.left,
    top: cs.top,
    bottom: cs.bottom,
    classes: aside.className,
    parentTag: parent?.tagName,
    parentClass: parent?.className,
    parentDisplay: parent ? getComputedStyle(parent).display : null,
    parentPosition: parent ? getComputedStyle(parent).position : null,
  }
})
writeFileSync('paneldiag.json', JSON.stringify(info, null, 2))
await browser.close()