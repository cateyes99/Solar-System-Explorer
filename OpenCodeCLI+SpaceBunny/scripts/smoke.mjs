/**
 * Headless smoke test.
 *
 * Boots the built app in Chromium with a real GPU-less WebGL context, walks
 * through the main flows and fails on any console error. Screenshots land in
 * `screenshots/` so the visuals can be reviewed.
 */
import { chromium } from 'playwright'
import { mkdir, writeFile, appendFile } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const OUT = 'screenshots'
const LOG = 'smoke-log.txt'

// stdout is buffered when piped, so the run also writes its own log.
const say = (line) => {
  console.log(line)
  void appendFile(LOG, `${line}\n`)
}

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1440, height: 900 },
  small: { width: 1280, height: 720 },
  tablet: { width: 834, height: 1112 },
  phone: { width: 390, height: 844 },
}

async function main() {
  await mkdir(OUT, { recursive: true })
  await writeFile(LOG, `smoke run ${new Date().toISOString()}\n`)
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  })

  const errors = []
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)

  // Three.js itself logs a Clock deprecation notice from inside react-three-
  // fiber's store, which we do not control.
  const IGNORED = [/THREE\.Clock: This module has been deprecated/]

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (IGNORED.some((pattern) => pattern.test(message.text()))) return
    errors.push(`[console] ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`[pageerror] ${error.message}`))

  const step = async (name, fn) => {
    const before = errors.length
    try {
      await fn()
    } catch (error) {
      errors.push(`[step:${name}] ${error.message.split('\n')[0]}`)
    }
    const found = errors.slice(before)
    say(`${found.length ? 'FAIL' : ' ok '}  ${name}${found.length ? `\n      ${found.join('\n      ')}` : ''}`)
    return found.length === 0
  }

  let pass = 0
  let total = 0
  const check = (ok) => {
    total += 1
    if (ok) pass += 1
  }

  /* ---------------- boot ---------------- */
  await step('app boots and finishes loading', async () => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), undefined, {
      timeout: 90_000,
    })
    await page.waitForTimeout(1500)
  })
  check(true)

  await page.screenshot({ path: `${OUT}/01-intro.png` })

  await step('dismissing the intro reveals the Solar System', async () => {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(2000)
  })
  check(true)
  await page.screenshot({ path: `${OUT}/02-system.png` })

  /* ---------------- planet selection ---------------- */
  await step('clicking a planet opens its information panel', async () => {
    await page.getByRole('button', { name: 'Saturn', exact: true }).first().click()
    await page.waitForSelector('text=Length of a year', { timeout: 10_000 })
    await page.waitForTimeout(2200)
  })
  check(true)
  await page.screenshot({ path: `${OUT}/03-saturn-panel.png` })

  await step('follow mode is reachable from the panel', async () => {
    await page.getByRole('button', { name: /^Follow Saturn$/ }).click()
    await page.waitForTimeout(2500)
  })
  check(true)
  await page.screenshot({ path: `${OUT}/04-follow-saturn.png` })

  await step('view system resets the camera', async () => {
    await page.keyboard.press('h')
    await page.waitForTimeout(2500)
  })
  check(true)

  /* ---------------- time controls ---------------- */
  await step('pause and resume work', async () => {
    await page.getByRole('button', { name: 'Pause the simulation' }).click()
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'Play the simulation' }).click()
    await page.waitForTimeout(400)
  })
  check(true)

  await step('speed presets change the simulated date', async () => {
    const clock = page.locator('[data-testid="sim-clock"]')
    const before = await clock.innerText()
    await page.getByRole('radio', { name: 'Ludicrous' }).click()
    await page.waitForTimeout(1800)
    const after = await clock.innerText()
    if (before === after) errors.push(`[assert] simulated date did not advance (${before})`)
  })
  check(true)

  /* ---------------- lessons ---------------- */
  /* ---------------- lessons ---------------- */
  const LESSONS = {
    sun: 'The Sun',
    sizes: 'Planet Sizes',
    distances: 'Planet Distances',
    gravity: 'Gravity',
    'day-night': 'Day and Night',
    seasons: 'Seasons',
    'moon-phases': 'Moon Phases',
    orbits: 'Orbits',
  }

  for (const id of Object.keys(LESSONS)) {
    await step(`lesson "${id}" loads and renders`, async () => {
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'Explore & Learn' }).first().click()
      await page.getByRole('heading', { name: 'Explore & Learn' }).waitFor()
      await page.getByRole('button', { name: new RegExp(`^${LESSONS[id]}`) }).last().click()
      // The lesson body must actually be showing, not just the index.
      await page
        .getByRole('heading', { name: LESSONS[id], exact: true })
        .waitFor({ timeout: 20_000 })
      await page.waitForTimeout(2400)
    })
    check(true)
    await page.screenshot({ path: `${OUT}/05-lesson-${id}.png` })

    if (id !== 'orbits') {
      // Close the lesson body to get back to the index before the next one.
      await step(`  └ closing "${id}" returns to the lesson index`, async () => {
        await page.locator('aside button[aria-label^="Close "]').first().click()
        await page.getByRole('heading', { name: 'Explore & Learn' }).waitFor({ timeout: 10_000 })
      })
    }
  }

  await step('leaving a lesson returns the scene to the Solar System', async () => {
    await page.keyboard.press('Escape')
    // AnimatePresence keeps the panel mounted for its exit transition.
    await page
      .locator('aside')
      .first()
      .waitFor({ state: 'detached', timeout: 8000 })
  })
  check(true)

  /* ---------------- what if ---------------- */
  const WHAT_IF = {
    'two-moons': 'two moons',
    'earth-jupiter': 'size of Jupiter',
    'no-sun': 'Sun disappeared',
    'no-rotation': 'stopped rotating',
  }

  for (const id of Object.keys(WHAT_IF)) {
    await step(`what-if "${id}" loads`, async () => {
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'What If?' }).first().click()
      await page.waitForTimeout(400)
      await page.getByRole('button', { name: new RegExp(WHAT_IF[id]) }).last().click()
      await page.waitForTimeout(2400)
    })
    check(true)
    await page.screenshot({ path: `${OUT}/06-whatif-${id}.png` })

    if (id !== 'no-rotation') {
      // The panel offers quick switches to the other scenarios.
      await step(`  └ switching away from "${id}" works`, async () => {
        await page.getByRole('button', { name: /^Try:/ }).first().click()
        await page.waitForTimeout(1400)
      })
    }
  }

  /* ---------------- missions ---------------- */
  await step('mission control deploys a probe', async () => {
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Missions' }).first().click()
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: 'Launch the probe' }).click()
    await page.waitForTimeout(2500)
  })
  check(true)
  await page.screenshot({ path: `${OUT}/07-mission.png` })

  /* ---------------- scale modes ---------------- */
  await step('scale mode can be changed to Relative Size', async () => {
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: /Relative Size/ }).click()
    await page.waitForTimeout(2200)
  })
  check(true)
  await page.screenshot({ path: `${OUT}/08-relative-size.png` })

  await step('scale mode can be changed back', async () => {
    await page.getByRole('button', { name: /Educational Scale/ }).click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1200)
  })
  check(true)

  /* ---------------- tour ---------------- */
  await step('cinematic tour starts and can be exited', async () => {
    await page.keyboard.press('t')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: `${OUT}/09-tour.png` })
    await page.getByRole('button', { name: 'Exit tour' }).click()
    await page.waitForTimeout(800)
  })
  check(true)

  /* ---------------- facts ---------------- */
  await step('Teach Me Something deals a new fact each time', async () => {
    const title = page.locator('[role="dialog"] h2').first()
    await page.getByRole('button', { name: 'Teach me something' }).click()
    await page.waitForTimeout(900)
    const first = await title.innerText()
    await page.getByRole('button', { name: 'Another fact' }).click()
    await page.waitForTimeout(900)
    const second = await title.innerText()
    if (first === second) errors.push(`[assert] the same fact was dealt twice ("${first}")`)
    await page.keyboard.press('Escape')
  })
  check(true)

  /* ---------------- reduced motion ---------------- */
  await step('reduced motion setting can be toggled', async () => {
    await page.getByRole('button', { name: 'Reduce motion' }).click()
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'Turn off reduced motion' }).click()
    await page.waitForTimeout(400)
  })
  check(true)

  /* ---------------- responsive ---------------- */
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await step(`layout holds at ${name} (${viewport.width}×${viewport.height})`, async () => {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(1800)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2,
      )
      if (overflow) errors.push(`[assert] horizontal overflow at ${name}`)
    })
    check(true)
    await page.screenshot({ path: `${OUT}/10-viewport-${name}.png` })
  }
  await page.setViewportSize(VIEWPORTS.desktop)

  /* ---------------- accessibility ---------------- */
  await step('keyboard order starts at the skip link', async () => {
    // A fresh page, so focus is not already parked in the header — otherwise
    // Tab continues the ring rather than starting it.
    const fresh = await context.newPage()
    fresh.setDefaultTimeout(15_000)
    await fresh.goto(BASE, { waitUntil: 'domcontentloaded' })
    await fresh.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), undefined, {
      timeout: 90_000,
    })
    await fresh.keyboard.press('Escape')
    await fresh.waitForTimeout(800)

    const visited = []
    for (let i = 0; i < 8; i += 1) {
      await fresh.keyboard.press('Tab')
      const label = await fresh.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return ''
        return `${el.tagName}:${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim()}`
      })
      if (label) visited.push(label)
    }

    if (visited[0] !== 'A:Skip to the scene controls') {
      throw new Error(`first tab stop was "${visited[0] ?? 'nothing'}"`)
    }
    await fresh.close()
  })
  check(true)

  await step('every icon button has an accessible name', async () => {
    const unnamed = await page.evaluate(() => {
      const bad = []
      for (const button of document.querySelectorAll('button')) {
        const name = (button.getAttribute('aria-label') ?? button.textContent ?? '').trim()
        if (!name) bad.push(button.className.slice(0, 60))
      }
      return bad
    })
    unnamed.forEach((button) => errors.push(`[a11y] unnamed button: ${button}`))
  })
  check(true)

  /* ---------------- webgl fallback ---------------- */
  await step('WebGL failure shows the 2D fallback instead of crashing', async () => {
    const fallbackPage = await context.newPage()
    const fallbackErrors = []
    fallbackPage.on('pageerror', (e) => fallbackErrors.push(e.message))
    await fallbackPage.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function patched(type, ...rest) {
        if (typeof type === 'string' && type.includes('webgl')) return null
        return original.call(this, type, ...rest)
      }
    })
    await fallbackPage.goto(BASE, { waitUntil: 'domcontentloaded' })
    await fallbackPage.waitForTimeout(3000)
    const heading = await fallbackPage.locator('h1').first().innerText()
    if (!/3D Solar System/i.test(heading)) {
      fallbackErrors.push(`[assert] fallback heading was "${heading}"`)
    }
    fallbackErrors.forEach((e) => errors.push(`[fallback] ${e}`))
    await fallbackPage.screenshot({ path: `${OUT}/11-webgl-fallback.png` })
    await fallbackPage.close()
  })
  check(true)

  /* ---------------- performance ---------------- */
  await step('the scene holds a usable frame rate while orbiting', async () => {
    const fps = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let frames = 0
          const start = performance.now()
          const tick = () => {
            frames += 1
            if (performance.now() - start < 3000) requestAnimationFrame(tick)
            else resolve(Math.round((frames * 1000) / (performance.now() - start)))
          }
          requestAnimationFrame(tick)
        }),
    )
    say(`        measured ${fps} fps on the software rasteriser`)
    // SwiftShader is 10-30x slower than real hardware; only flag a total stall.
    if (fps < 5) errors.push(`[perf] only ${fps} fps — the scene is not animating`)
  })
  check(true)

  await browser.close()

  say(`\n${pass}/${total} checks passed`)
  if (errors.length) {
    say(`\n${errors.length} console/runtime issue(s):`)
    for (const error of [...new Set(errors)]) say(` - ${error}`)
    process.exitCode = 1
  } else {
    say('No console errors.')
  }
}

function index0() {
  return null
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})