import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const log = []
page.on('console', (m) => log.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}\n${e.stack ?? ''}`))

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
log.push('--- webgl probe ---')
log.push(
  JSON.stringify(
    await page.evaluate(() => {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl2') || c.getContext('webgl')
      return gl
        ? { ok: true, renderer: gl.getParameter(gl.VERSION) }
        : { ok: false }
    }),
  ),
)

for (const seconds of [3, 6, 10, 20, 40, 70]) {
  await page.waitForTimeout(seconds === 3 ? 3000 : 3000)
  const state = await page.evaluate(() => ({
    canvases: document.querySelectorAll('canvas').length,
    bodyStart: (document.body.innerText || '').slice(0, 160).replace(/\s+/g, ' '),
  }))
  log.push(`t≈${seconds}s ${JSON.stringify(state)}`)
}

log.push('--- console ---')
log.push(...log.filter((l) => l.startsWith('[')).join('\n'))
writeFileSync('diag.txt', log.join('\n'))
await browser.close()