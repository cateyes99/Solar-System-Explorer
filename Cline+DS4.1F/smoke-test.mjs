/**
 * Temporary smoke test: loads the built app in headless Chrome, exercises the
 * main interactions and reports console errors plus screenshots.
 * (Not part of the shipped app — used only to verify the build.)
 */
import puppeteer from 'puppeteer'
import { writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

/** Finds a Chromium build to drive: puppeteer's cache first, then Edge. */
function resolveBrowser() {
  const cacheRoot = join(homedir(), '.cache', 'puppeteer', 'chrome')
  if (existsSync(cacheRoot)) {
    for (const entry of readdirSync(cacheRoot)) {
      const candidate = join(cacheRoot, entry, 'chrome-win64', 'chrome.exe')
      if (existsSync(candidate)) return candidate
    }
  }
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  if (existsSync(edge)) return edge
  return undefined
}

const url = process.argv[2] ?? 'http://localhost:4173/'
const outDir = process.argv[3] ?? '.'
const executablePath = resolveBrowser()

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--window-size=1440,900',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

const messages = []
page.on('console', (message) => {
  const type = message.type()
  if (type === 'error' || type === 'warning') {
    messages.push(`[${type}] ${message.text()}`)
  }
})
page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`))
page.on('requestfailed', (request) =>
  messages.push(`[requestfailed] ${request.url()} ${request.failure()?.errorText ?? ''}`),
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const clickText = async (text) =>
  page.evaluate((needle) => {
    const button = [...document.querySelectorAll('button')].find((element) =>
      element.textContent?.includes(needle),
    )
    if (button) {
      button.click()
      return true
    }
    return false
  }, text)

await page.goto(url, { waitUntil: 'load', timeout: 60000 })

// Wait for the interface to appear (the quick-travel nav is part of the HUD).
let ready = true
try {
  await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
} catch {
  ready = false
}
await sleep(4000)

const report = {
  interfaceReady: ready,
  usingFallback2D: await page.evaluate(() => document.body.innerText.includes('Simplified 2D view')),
  hasCanvas: await page.evaluate(() => Boolean(document.querySelector('canvas'))),
  webglRenderer: await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return null
    try {
      const gl = canvas.getContext('webgl2')
      if (!gl) return null
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'webgl2'
    } catch {
      return null
    }
  }),
}

await page.screenshot({ path: `${outDir}/smoke-1-system.png` })

// Focus Earth from the quick-travel strip.
await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
    element.textContent?.includes('Earth'),
  )
  button?.click()
})
await sleep(4500)
await page.screenshot({ path: `${outDir}/smoke-2-earth.png` })

// Information panel should be open now. (Match the panel, not the text, because
// CSS text-transform changes what innerText reports.)
report.planetPanelOpen = await page.evaluate(() => {
  const panel = document.querySelector('aside[aria-label="Earth information"]')
  if (!panel) return false
  const rect = panel.getBoundingClientRect()
  return rect.width > 200 && rect.height > 200
})
report.planetPanelSections = await page.evaluate(() => {
  const panel = document.querySelector('aside[aria-label="Earth information"]')
  if (!panel) return []
  return [...panel.querySelectorAll('.sse-label-text')].map((node) => node.textContent?.trim() ?? '')
})

// Start the cinematic tour.
report.tourStarted = await clickText('Cinematic Tour')
await sleep(12000)
await page.screenshot({ path: `${outDir}/smoke-3-tour.png` })

// The tour card owns the top-left corner: the control panel must move below it.
report.tourLayout = await page.evaluate(() => {
  const card = document.querySelector('[aria-label="Cinematic tour"]')?.getBoundingClientRect() ?? null
  const panel =
    document
      .querySelector('aside[aria-label="Scale, layers and camera controls"]')
      ?.getBoundingClientRect() ?? null
  return {
    tourCardBottom: card ? Math.round(card.bottom) : null,
    leftPanelTop: panel ? Math.round(panel.top) : null,
    leftPanelClearsTourCard: card && panel ? panel.top >= card.bottom : null,
  }
})

// Leave the tour, open the lessons.
await clickText('Exit tour')
await sleep(1200)
await clickText('Explore & Learn')
await sleep(1500)
report.lessonsOpened = await page.evaluate(() => document.body.innerText.includes('Explore & Learn'))
await clickText('Gravity')
await sleep(1200)
await page.screenshot({ path: `${outDir}/smoke-4-lessons.png` })

// What If experiments.
await clickText('What If?')
await sleep(1200)
report.whatIfOpen = await page.evaluate(
  () => Boolean(document.querySelector('[aria-label="What if experiments"]')),
)
report.whatIfScenarios = await page.evaluate(() => {
  const sheet = document.querySelector('[aria-label="What if experiments"]')
  if (!sheet) return []
  return [...sheet.querySelectorAll('button')]
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter((label) => label.includes('What if'))
})
await page.screenshot({ path: `${outDir}/smoke-5-whatif.png` })
await clickText('Close the What If panel')
await sleep(800)

// Mission Control.
await clickText('Mission Control')
await sleep(2500)
report.missionControlOpen = await page.evaluate(() =>
  Boolean(document.querySelector('[aria-label="Mission Control"]')),
)
report.missionControlReadouts = await page.evaluate(() => {
  const sheet = document.querySelector('[aria-label="Mission Control"]')
  if (!sheet) return []
  return [...sheet.querySelectorAll('dt, span')]
    .map((node) => node.textContent?.trim() ?? '')
    .filter((text) => text.length > 2 && text.length < 40)
    .slice(0, 14)
})
await page.screenshot({ path: `${outDir}/smoke-6-mission.png` })

// Layout sanity: the HUD pieces must not sit on top of each other.
report.layout = await page.evaluate(() => {
  const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null
  const left = rect('aside[aria-label="Scale, layers and camera controls"]')
  const nav = rect('nav[aria-label="Quick travel to a world"]')
  const time = rect('[aria-label="Time controls"], section[aria-label*="ime"]')
  return {
    leftPanelBottom: left ? Math.round(left.bottom) : null,
    quickTravelTop: nav ? Math.round(nav.top) : null,
    quickTravelBottom: nav ? Math.round(nav.bottom) : null,
    timeControlsTop: time ? Math.round(time.top) : null,
    leftPanelClearsQuickTravel: left && nav ? left.bottom <= nav.top : null,
  }
})
await page.screenshot({ path: `${outDir}/smoke-7-layout.png` })

// Settings sheet (mobile-style options live here).
await sleep(1200)

// Phone layout: the footer wraps, so measure it rather than guessing.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await page.reload({ waitUntil: 'load', timeout: 60000 })
try {
  await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
} catch {
  report.mobileReady = false
}
await sleep(4000)
report.mobile = await page.evaluate(() => {
  const footer = document.querySelector('footer')
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  return {
    footerHeight: footer ? Math.round(footer.getBoundingClientRect().height) : null,
    quickTravelTop: nav ? Math.round(nav.getBoundingClientRect().top) : null,
    canvasWidth: Math.round(document.querySelector('canvas')?.getBoundingClientRect().width ?? 0),
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    headerHeight: Math.round(
      document.querySelector('header')?.getBoundingClientRect().height ?? 0,
    ),
  }
})
await page.screenshot({ path: `${outDir}/smoke-8-mobile.png` })

// A sheet must sit above the phone footer, not behind it.
await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
    element.textContent?.includes('Saturn'),
  )
  button?.click()
})
await sleep(4000)
report.mobileSheet = await page.evaluate(() => {
  const sheet = document.querySelector('aside[aria-label="Saturn information"]')
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  if (!sheet || !nav) return null
  const sheetRect = sheet.getBoundingClientRect()
  const navRect = nav.getBoundingClientRect()
  return {
    sheetTop: Math.round(sheetRect.top),
    sheetBottom: Math.round(sheetRect.bottom),
    quickTravelTop: Math.round(navRect.top),
    sheetClearsQuickTravel: sheetRect.bottom <= navRect.top,
    sheetVisibleHeight: Math.round(sheetRect.height),
  }
})
await page.screenshot({ path: `${outDir}/smoke-9-mobile-sheet.png` })

report.messages = messages
writeFileSync(`${outDir}/smoke-report.json`, JSON.stringify(report, null, 2))

console.log(JSON.stringify(report, null, 2))
await browser.close()
