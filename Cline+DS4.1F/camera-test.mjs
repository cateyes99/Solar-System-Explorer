/**
 * Temporary focused test for the camera controller (deleted after use).
 */
import puppeteer from 'puppeteer'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

function resolveBrowser() {
  const cacheRoot = join(homedir(), '.cache', 'puppeteer', 'chrome')
  if (existsSync(cacheRoot)) {
    for (const entry of readdirSync(cacheRoot)) {
      const candidate = join(cacheRoot, entry, 'chrome-win64', 'chrome.exe')
      if (existsSync(candidate)) return candidate
    }
  }
  return 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
}

const url = process.argv[2] ?? 'http://localhost:4173/'
const browser = await puppeteer.launch({
  headless: true,
  executablePath: resolveBrowser(),
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const logs = []
page.on('console', (message) => logs.push(`[${message.type()}] ${message.text()}`))
page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}`))

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sample = async () =>
  page.evaluate(() => ({
    pos: document.documentElement.dataset.cameraPos ?? 'n/a',
    tween: document.documentElement.dataset.cameraTween ?? 'n/a',
    reduced: document.documentElement.dataset.reducedMotion ?? 'n/a',
  }))

await page.goto(url, { waitUntil: 'load', timeout: 60000 })
await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
await sleep(2000)
console.log('before click:', JSON.stringify(await sample()))

await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
    element.textContent?.includes('Earth'),
  )
  button?.click()
})

for (let i = 0; i < 10; i += 1) {
  await sleep(600)
  console.log(`sample ${i}:`, JSON.stringify(await sample()))
}

await page.screenshot({ path: 'camera-after-earth.png' })
console.log('LOGS:')
console.log(logs.join('\n'))
await browser.close()
