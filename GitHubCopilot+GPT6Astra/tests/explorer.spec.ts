import { test, expect } from '@playwright/test'
import { tourStops } from '../src/data/planets'

test('Earth cloud shapes evolve independently of rotation and respect motion controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.getByRole('button', { name: 'Earth 03', exact: true }).click()
  const canvas = page.locator('.scene canvas')
  const cloudState = (settings: Record<string, unknown> = {}, compareShapes = false) => page.evaluate(async ({ settings, compareShapes }) => {
    const resources = performance.getEntriesByType('resource').map(entry => entry.name)
    const storePath = resources.find(name => new URL(name).pathname === '/src/store/simulationStore.ts')!
    const fiberPath = resources.find(name => new URL(name).pathname.endsWith('/@react-three_fiber.js'))!
    const { useSimulation } = await import(storePath)
    const { _roots } = await import(fiberPath)
    useSimulation.getState().set(settings)
    const element = document.querySelector<HTMLCanvasElement>('.scene canvas')!
    const { scene, camera, gl } = _roots.get(element).store.getState()
    const clouds = scene.getObjectByName('earth-clouds')
    const clock = clouds.material.userData.cloudTime
    let changedPixels = 0
    if (compareShapes) {
      const renderer = element.getContext('webgl2')!
      const before = new Uint8Array(element.width * element.height * 4)
      const after = new Uint8Array(before.length)
      clock.value = 0
      gl.render(scene, camera)
      renderer.readPixels(0, 0, element.width, element.height, renderer.RGBA, renderer.UNSIGNED_BYTE, before)
      clock.value = 8
      gl.render(scene, camera)
      renderer.readPixels(0, 0, element.width, element.height, renderer.RGBA, renderer.UNSIGNED_BYTE, after)
      for (let index = 0; index < before.length; index += 4) {
        if (Math.abs(before[index] - after[index]) + Math.abs(before[index + 1] - after[index + 1]) + Math.abs(before[index + 2] - after[index + 2]) > 24) changedPixels++
      }
    }
    return { time: clock.value as number, rotation: clouds.rotation.y as number, changedPixels }
  }, { settings, compareShapes })
  await cloudState({ speed: 0, paused: true, reducedMotion: true })
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    const before = await cloudState()
    const after = await cloudState({}, true)
    expect(after.rotation).toBe(before.rotation)
    expect(after.changedPixels).toBeGreaterThan(100)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/earth-cloud-shapes-${width}.png` })
  }
  const moving = await cloudState({ paused: false, reducedMotion: false })
  await expect.poll(async () => (await cloudState()).time).toBeGreaterThan(moving.time + .2)
  expect((await cloudState()).rotation).toBeGreaterThan(moving.rotation)
  for (const settings of [{ paused: true }, { paused: false, reducedMotion: true }, { reducedMotion: false, experiment: 'no-spin' }]) {
    const stopped = await cloudState(settings)
    await page.evaluate(() => new Promise<void>(resolve => {
      let frames = 0
      const next = () => { if (++frames === 8) resolve(); else requestAnimationFrame(next) }
      requestAnimationFrame(next)
    }))
    expect(await cloudState()).toEqual(stopped)
  }
  const resumed = await cloudState({ experiment: 'none' })
  await expect.poll(async () => (await cloudState()).time).toBeGreaterThan(resumed.time)
  expect(errors).toEqual([])
})

test('Earth atmosphere drifts subtly and respects motion controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.getByRole('button', { name: 'Earth 03', exact: true }).click()
  const canvas = page.locator('.scene canvas')
  const atmosphereTime = (settings: Record<string, unknown> = {}) => page.evaluate(async settings => {
    const resources = performance.getEntriesByType('resource').map(entry => entry.name)
    const storePath = resources.find(name => new URL(name).pathname === '/src/store/simulationStore.ts')!
    const fiberPath = resources.find(name => new URL(name).pathname.endsWith('/@react-three_fiber.js'))!
    const { useSimulation } = await import(storePath)
    const { _roots } = await import(fiberPath)
    useSimulation.getState().set(settings)
    const scene = _roots.get(document.querySelector('.scene canvas')).store.getState().scene
    let time: number | undefined
    scene.traverse((object: { material?: { uniforms?: { motion?: { value: number }; time: { value: number } } } }) => {
      if (object.material?.uniforms?.motion?.value === 1) time = object.material.uniforms.time.value
    })
    if (time === undefined) throw new Error('Earth atmosphere material was not found.')
    return time
  }, settings)
  await atmosphereTime({ speed: 0, paused: false, reducedMotion: false })
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    const before = await atmosphereTime()
    const first = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())
    await expect.poll(() => atmosphereTime()).toBeGreaterThan(before + .2)
    await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(first)
    const litPixels = await canvas.evaluate(element => {
      const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(40 * 40 * 4)
      const centerY = innerWidth <= 800 ? element.height * .8 : element.height / 2
      renderer.readPixels(Math.floor(element.width / 2) - 20, Math.floor(centerY) - 20, 40, 40, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 20).length
    })
    expect(litPixels).toBeGreaterThan(100)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/earth-atmosphere-${width}.png` })
  }
  for (const settings of [{ paused: true }, { paused: false, reducedMotion: true }, { reducedMotion: false, experiment: 'no-spin' }]) {
    const stopped = await atmosphereTime(settings)
    await page.evaluate(() => new Promise<void>(resolve => {
      let frames = 0
      const next = () => { if (++frames === 8) resolve(); else requestAnimationFrame(next) }
      requestAnimationFrame(next)
    }))
    expect(await atmosphereTime()).toBe(stopped)
  }
  const resumed = await atmosphereTime({ experiment: 'none' })
  await expect.poll(() => atmosphereTime()).toBeGreaterThan(resumed)
  expect(errors).toEqual([])
})

test('renders the solar system, animates pixels, and selects Earth', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-moving', 'false')
  await expect(page.getByRole('heading', { name: /Our cosmic/ })).toBeVisible()
  const first = await page.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())
  await expect.poll(async () => page.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).not.toBe(first)
  const pixels = await page.locator('canvas').evaluate(canvas => {
    const renderer = (canvas as HTMLCanvasElement).getContext('webgl2')!
    const data = new Uint8Array(80 * 80 * 4)
    renderer.readPixels(Math.floor(canvas.width / 2) - 40, Math.floor(canvas.height / 2) - 40, 80, 80, renderer.RGBA, renderer.UNSIGNED_BYTE, data)
    return Array.from(data).filter((value, index) => index % 4 !== 3 && value > 30).length
  })
  expect(pixels).toBeGreaterThan(100)
  await page.screenshot({ path: 'test-results/desktop-overview.png' })
  await page.getByRole('button', { name: 'Earth 03', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Earth information' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Earth.' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-moving', 'false')
  await page.screenshot({ path: 'test-results/earth-focus.png' })
  expect(errors).toEqual([])
})

test('Pluto loads its observed surface and rotates with the date on desktop and mobile', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const texture = page.waitForResponse(response => response.url().endsWith('/textures/pluto.jpg'))
  await page.goto('/')
  expect((await texture).status()).toBe(200)
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  const canvas = page.locator('.scene canvas')
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await page.screenshot({ path: 'test-results/pluto-overview-desktop.png' })
  const indexBounds = (await page.getByRole('complementary', { name: 'Celestial objects' }).boundingBox())!
  const clockBounds = (await page.locator('.time-bar').boundingBox())!
  expect(indexBounds.y + indexBounds.height).toBeLessThan(clockBounds.y)
  await expect(page.locator('.planet-index .index-item').nth(9)).toHaveAccessibleName('Pluto 09')
  await expect(page.locator('.planet-index .index-item').nth(10)).toHaveAccessibleName("Halley's Comet 10")
  await page.getByRole('button', { name: 'Pluto 09', exact: true }).click()
  const panel = page.getByRole('complementary', { name: 'Pluto information' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Dwarf planet / Kuiper Belt')
  await expect(panel).toContainText('2,377')
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await page.getByRole('button', { name: 'View Planet', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  const first = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())
  await page.screenshot({ path: 'test-results/pluto-focus-desktop.png' })
  await page.getByRole('button', { name: 'Advance one day', exact: true }).click()
  await expect.poll(async () => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(first)
  await page.getByRole('button', { name: 'Follow Planet', exact: true }).click()
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    const litPixels = await canvas.evaluate(element => {
      const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(40 * 40 * 4)
      const centerY = innerWidth <= 800 ? element.height * .8 : element.height / 2
      renderer.readPixels(Math.floor(element.width / 2) - 20, Math.floor(centerY) - 20, 40, 40, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 20).length
    })
    expect(litPixels).toBeGreaterThan(100)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/pluto-focus-${width}.png` })
  }
  await page.getByRole('button', { name: 'Close planet information', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await page.screenshot({ path: 'test-results/pluto-overview-mobile.png' })
  await page.getByRole('button', { name: 'Cinematic Tour', exact: true }).click()
  const tour = page.getByRole('region', { name: 'Cinematic tour' })
  await tour.getByRole('button', { name: 'Step 12: Meet Pluto.', exact: true }).click()
  await expect(tour.getByRole('heading')).toHaveText('Meet Pluto.')
  await expect(tour).toContainText('12 OF 13')
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await tour.getByRole('button', { name: 'Pause tour', exact: true }).click()
  await page.screenshot({ path: 'test-results/pluto-tour-mobile.png' })
  await tour.getByRole('button', { name: 'Next stop', exact: true }).click()
  await expect(tour.getByRole('heading')).toHaveText('Keep looking up.')
  await tour.getByRole('button', { name: 'Next stop', exact: true }).click()
  await expect(tour).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Halley has an inspectable nucleus, full orbit, and dated active appearances', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  await page.locator('.index-item').filter({ hasText: "Halley's Comet" }).click()
  const panel = page.getByRole('complementary', { name: "Halley's Comet information" })
  const canvas = page.locator('.scene canvas')
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('15 x 8')
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  const nucleus = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())
  const nucleusBrightness = await canvas.evaluate(element => {
    const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
    const pixels = new Uint8Array(32 * 32 * 4)
    renderer.readPixels(Math.floor(element.width / 2) - 16, Math.floor(element.height / 2) - 16, 32, 32, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
    let luminance = 0
    for (let index = 0; index < pixels.length; index += 4) luminance += .2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2]
    return luminance / (32 * 32)
  })
  expect(nucleusBrightness).toBeGreaterThan(55)
  await page.screenshot({ path: 'test-results/halley-nucleus-desktop.png' })
  await page.getByRole('button', { name: 'Play simulation', exact: true }).click()
  await expect.poll(async () => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(nucleus)
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  await page.getByRole('button', { name: 'View full orbit', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await page.screenshot({ path: 'test-results/halley-orbit-desktop.png' })
  await page.getByRole('button', { name: '1986 perihelion', exact: true }).click()
  await expect(page.locator('time')).toHaveText('09 Feb 1986')
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  expect(await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(nucleus)
  await page.screenshot({ path: 'test-results/halley-active-desktop.png' })
  await page.getByRole('button', { name: '2061 perihelion', exact: true }).click()
  await expect(page.locator('time')).toHaveText('28 Jul 2061')
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    const litPixels = await canvas.evaluate(element => {
      const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(80 * 80 * 4)
      const centerY = innerWidth <= 800 ? element.height * .8 : element.height / 2
      renderer.readPixels(Math.floor(element.width / 2) - 40, Math.floor(centerY) - 40, 80, 80, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 12).length
    })
    expect(litPixels).toBeGreaterThan(100)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/halley-active-${width}.png` })
  }
  await page.getByRole('button', { name: 'View full orbit', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await page.screenshot({ path: 'test-results/halley-orbit-mobile.png' })
  expect(errors).toEqual([])
})

test('Halley crosses aphelion with a closed orbit', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.index-item').filter({ hasText: "Halley's Comet" }).click()
  await page.evaluate(async () => {
    const modulePath = performance.getEntriesByType('resource').map(entry => entry.name).find(name => new URL(name).pathname === '/src/store/simulationStore.ts')
    if (!modulePath) throw new Error('The simulation store was not loaded.')
    const { useSimulation } = await import(modulePath)
    useSimulation.getState().set({ days: (Date.UTC(2023, 11, 1) - Date.UTC(2026, 8, 26, 12)) / 86400000, paused: true, reducedMotion: false, speed: 365 })
  })
  const canvas = page.locator('.scene canvas')
  await page.getByRole('button', { name: 'View full orbit', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
  await expect(page.locator('time')).toHaveText('01 Dec 2023')
  const before = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())
  await page.getByRole('button', { name: 'Play simulation', exact: true }).click()
  await expect.poll(async () => Date.parse((await page.locator('time').getAttribute('dateTime'))!)).toBeGreaterThanOrEqual(Date.UTC(2024, 0, 1))
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  expect(await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(before)
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    const litPixels = await canvas.evaluate(element => {
      const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(element.width * element.height * 4)
      renderer.readPixels(0, 0, element.width, element.height, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 25).length
    })
    expect(litPixels).toBeGreaterThan(100)
    await page.screenshot({ path: `test-results/halley-closed-orbit-${width}.png` })
  }
  expect(errors).toEqual([])
})

for (const width of [1440, 390]) {
  test(`JPL limit consent and approximate reset work at ${width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
    await page.locator('.index-item').filter({ hasText: "Halley's Comet" }).click()
    const reachBoundary = async (manual = false) => page.evaluate(async manualStep => {
      const resources = performance.getEntriesByType('resource').map(entry => entry.name)
      const storePath = resources.find(name => new URL(name).pathname === '/src/store/simulationStore.ts')!
      const astronomyPath = resources.find(name => new URL(name).pathname === '/src/utils/astronomy.ts')!
      const { useSimulation } = await import(storePath)
      const { MAX_DAYS } = await import(astronomyPath)
      useSimulation.getState().set({ days: MAX_DAYS - .05, speed: 1, paused: manualStep, reducedMotion: false })
    }, manual)
    await reachBoundary()
    const dialog = page.getByRole('dialog', { name: 'JPL data limit' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Now it has reached the date limit of JPL data')
    await expect(dialog).toContainText('Would you like to switch to approximate orbital calculations outside the available data range?')
    await expect(dialog.getByRole('button', { name: 'No', exact: true })).toBeFocused()
    await page.screenshot({ path: `test-results/jpl-consent-${width}.png` })
    await dialog.getByRole('button', { name: 'No', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Play simulation', exact: true })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Approximate positions' })).toHaveCount(0)
    const stoppedDate = await page.locator('time').getAttribute('dateTime')
    await page.getByRole('button', { name: 'Advance one day', exact: true }).click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page.locator('time')).toHaveAttribute('dateTime', stoppedDate!)
    await page.getByRole('button', { name: 'Play simulation', exact: true }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Yes', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Approximate positions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pause simulation', exact: true })).toBeVisible()
    await expect(page.locator('time')).not.toHaveAttribute('dateTime', stoppedDate!)
    const canvas = page.locator('.scene canvas')
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    const pixels = await canvas.evaluate(element => {
      const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(80 * 80 * 4)
      const centerY = innerWidth <= 800 ? element.height * .8 : element.height / 2
      renderer.readPixels(Math.floor(element.width / 2) - 40, Math.floor(centerY) - 40, 80, 80, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 12).length
    })
    expect(pixels).toBeGreaterThan(100)
    await page.screenshot({ path: `test-results/jpl-approximate-${width}.png` })
    await page.getByRole('button', { name: 'Reset simulation date', exact: true }).click()
    await expect(page.locator('time')).toHaveAttribute('dateTime', /^2026/)
    await expect(page.getByRole('status').filter({ hasText: 'Approximate positions' })).toHaveCount(0)
    await reachBoundary(true)
    await page.getByRole('button', { name: 'Advance one day', exact: true }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Reset simulation date', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.locator('time')).toHaveText('26 Sept 2026')
    expect(errors).toEqual([])
  })
}

for (const width of [1440, 390]) {
  test(`paused date selection works at ${width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
    await expect(page.getByRole('button', { name: 'Set simulation date', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
    await page.getByRole('button', { name: 'Reset simulation date', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Set simulation date', exact: true })
    const openPicker = () => page.getByRole('button', { name: 'Set simulation date', exact: true }).click()
    await openPicker()
    await expect(picker.getByLabel('Date (UTC)', { exact: true })).toHaveValue('2026-09-26')
    await expect(picker.getByLabel('Date (UTC)', { exact: true })).toBeFocused()
    await picker.getByLabel('Date (UTC)', { exact: true }).fill('2024-02-29')
    await page.screenshot({ path: `test-results/date-picker-${width}.png` })
    await picker.getByRole('button', { name: 'Apply date', exact: true }).click()
    await expect(picker).not.toBeVisible()
    await expect(page.locator('time')).toHaveAttribute('dateTime', '2024-02-29T12:00:00.000Z')
    await expect(page.getByRole('button', { name: 'Play simulation', exact: true })).toBeVisible()
    await openPicker()
    await picker.getByLabel('Date (UTC)', { exact: true }).fill('2000-01-01')
    await picker.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.locator('time')).toHaveText('29 Feb 2024')
    await openPicker()
    await page.keyboard.press('Escape')
    await expect(picker).not.toBeVisible()
    await expect(page.locator('time')).toHaveText('29 Feb 2024')
    await openPicker()
    await picker.getByLabel('Date (UTC)', { exact: true }).fill('')
    await picker.getByRole('button', { name: 'Apply date', exact: true }).click()
    await expect(picker).toBeVisible()
    await picker.getByLabel('Date (UTC)', { exact: true }).fill('2100-01-01')
    await picker.getByRole('button', { name: 'Apply date', exact: true }).click()
    const consent = page.getByRole('dialog', { name: 'JPL data limit' })
    await expect(consent).toBeVisible()
    await expect(consent).toContainText('01 Jan 2100')
    await consent.getByRole('button', { name: 'No', exact: true }).click()
    await expect(page.locator('time')).toHaveText('29 Feb 2024')
    await openPicker()
    await picker.getByLabel('Date (UTC)', { exact: true }).fill('2100-01-01')
    await picker.getByRole('button', { name: 'Apply date', exact: true }).click()
    await consent.getByRole('button', { name: 'Yes', exact: true }).click()
    await expect(page.locator('time')).toHaveAttribute('dateTime', '2100-01-01T12:00:00.000Z')
    await expect(page.getByRole('button', { name: 'Play simulation', exact: true })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Approximate positions' })).toBeVisible()
    await expect(page.locator('canvas')).toHaveAttribute('data-camera-moving', 'false')
    const pixels = await page.locator('canvas').evaluate(element => {
      const renderer = (element as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(element.width * element.height * 4)
      renderer.readPixels(0, 0, element.width, element.height, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 25).length
    })
    expect(pixels).toBeGreaterThan(100)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/selected-date-${width}.png` })
    await page.getByRole('button', { name: 'Reset simulation date', exact: true }).click()
    await expect(page.locator('time')).toHaveText('26 Sept 2026')
    await expect(page.getByRole('status').filter({ hasText: 'Approximate positions' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Play simulation', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Set simulation date', exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('time, keyboard, camera, labels, and reduced motion work', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play simulation', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset simulation date' }).click()
  await expect(page.locator('time')).toHaveText('26 Sept 2026')
  await page.getByRole('button', { name: 'Advance one day' }).click()
  await expect(page.locator('time')).toHaveText('27 Sept 2026')
  await page.getByRole('button', { name: 'Very Fast', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Very Fast', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Reduce Motion', { exact: false }).check()
  await expect(page.locator('.app')).toHaveClass(/reduced-motion/)
  await page.getByLabel('Planet Labels', { exact: false }).uncheck()
  await expect(page.getByRole('button', { name: 'Explore Neptune', exact: true })).not.toBeVisible()
  await page.getByLabel('Visual scale').selectOption('custom')
  await page.getByLabel('Planet size').fill('1.5')
  await expect(page.getByLabel('Planet size')).toHaveValue('1.5')
  await page.getByLabel('Visual scale').selectOption('educational')
  await page.getByRole('button', { name: 'Close settings' }).click()
  await page.locator('body').click({ position: { x: 700, y: 320 } })
  await page.keyboard.press('l')
  await expect(page.getByRole('button', { name: 'Labels', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Earth 03', exact: true }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-moving', 'false')
  await page.getByRole('button', { name: 'View Planet', exact: true }).click()
  const before = await page.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())
  await page.mouse.move(700, 380)
  await page.mouse.down()
  await page.mouse.move(820, 450, { steps: 12 })
  await page.mouse.up()
  await expect.poll(async () => page.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).not.toBe(before)
  await page.keyboard.press('h')
  await expect(page.getByRole('complementary', { name: 'Earth information' })).toHaveCount(0)
})

test('Ctrl-drag pans horizontally and vertically without snapping back in follow mode', async ({ page }) => {
  test.setTimeout(150000)
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  const canvas = page.locator('.scene canvas')
  const label = page.locator('#scene-label-earth')
  const labelPosition = () => label.evaluate(element => {
    const anchor = element.style.transform.split(')')[0] + ')'
    const transform = new DOMMatrix(anchor)
    return { x: transform.m41, y: transform.m42 }
  })
  for (const view of ['overview', 'follow']) {
    if (view === 'follow') await page.getByRole('button', { name: 'Earth 03', exact: true }).click()
    await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
    for (const [horizontal, vertical] of [[70, 0], [0, -60]]) {
      const before = await labelPosition()
      await page.keyboard.down('Control')
      await page.mouse.move(850, 520)
      await page.mouse.down()
      await page.mouse.move(850 + horizontal, 520 + vertical, { steps: 8 })
      await page.mouse.up()
      await page.keyboard.up('Control')
      await expect.poll(async () => {
        const after = await labelPosition()
        return horizontal ? after.x - before.x : before.y - after.y
      }).toBeGreaterThan(25)
      await expect.poll(async () => {
        const first = await labelPosition()
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
        const second = await labelPosition()
        return Math.hypot(second.x - first.x, second.y - first.y)
      }).toBeLessThan(.1)
      const after = await labelPosition()
      expect(horizontal ? after.x - before.x : before.y - after.y).toBeGreaterThan(25)
    }
    await page.screenshot({ path: `test-results/ctrl-pan-${view}.png` })
  }
  await page.keyboard.press('h')
  await expect(page.getByRole('complementary', { name: 'Earth information' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-camera-moving', 'false')
})

test('tour supports start, pause, resume, skip, and exit', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'Cinematic Tour' }).click()
  await expect(page.getByRole('region', { name: 'Cinematic tour' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause tour' }).click()
  await expect(page.getByRole('button', { name: 'Resume tour' })).toBeVisible()
  await page.getByRole('button', { name: 'Next stop' }).click()
  await expect(page.getByRole('heading', { name: 'Meet Sun.' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume tour' }).click()
  await expect(page.getByRole('button', { name: 'Pause tour' })).toBeVisible()
  await page.getByRole('button', { name: 'Exit tour', exact: true }).last().click()
  await expect(page.getByRole('region', { name: 'Cinematic tour' })).toHaveCount(0)
})

test('tour steps jump in either direction and restart automatic playback', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?fallback')
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.getByRole('button', { name: 'Cinematic Tour' }).click()
  const popup = page.getByRole('region', { name: 'Cinematic tour' })
  const steps = popup.getByRole('navigation', { name: 'Tour steps' }).getByRole('button')
  await expect(steps).toHaveCount(13)
  await page.getByRole('button', { name: 'Pause tour' }).click()
  for (const index of [9, 3, 0, 12, 11, 6, 5, 7, 8, 10, 2, 1, 4]) {
    await steps.nth(index).click()
    await expect(popup.getByRole('heading')).toHaveText(tourStops[index].title)
    await expect(steps.nth(index)).toHaveAttribute('aria-current', 'step')
    await expect(popup.getByRole('button', { name: 'Pause tour' })).toBeVisible()
  }
  await page.clock.runFor(10000)
  await steps.nth(4).focus()
  await page.keyboard.press('Enter')
  await page.clock.runFor(1000)
  await expect(steps.nth(4)).toHaveAttribute('aria-current', 'step')
  await page.clock.runFor(9500)
  await expect(steps.nth(5)).toHaveAttribute('aria-current', 'step')
  await expect(popup.getByRole('heading')).toHaveText(tourStops[5].title)
  await steps.nth(10).click()
  await page.clock.runFor(10500)
  await expect(steps.nth(11)).toHaveAttribute('aria-current', 'step')
  await expect(popup.getByRole('heading')).toHaveText('Meet Pluto.')
  await page.clock.runFor(10500)
  await expect(steps.last()).toHaveAttribute('aria-current', 'step')
  await page.clock.runFor(10500)
  await expect(popup).toHaveCount(0)
})

test('tour popup drags, stays on screen, and adjusts opacity in one-percent steps', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'Cinematic Tour' }).click()
  const popup = page.getByRole('region', { name: 'Cinematic tour' })
  const handle = page.getByRole('button', { name: 'Move tour popup' })
  const opacity = page.getByRole('slider', { name: 'Opacity' })
  await page.getByRole('button', { name: 'Pause tour' }).click()
  await expect(opacity).toHaveAttribute('step', '1')
  await opacity.fill('37')
  await expect(popup.locator('output')).toHaveText('37%')
  await expect(popup.locator('.tour-narration')).toHaveCSS('opacity', '0.37')
  await opacity.press('ArrowRight')
  await expect(opacity).toHaveValue('38')
  await opacity.fill('0')
  await expect(popup.locator('.tour-narration')).toHaveCSS('opacity', '0')
  await expect(popup.locator('.tour-narration')).toHaveAttribute('inert', '')
  await expect(popup.locator('.tour-toolbar')).toBeVisible()
  await opacity.fill('100')
  await expect(popup.locator('.tour-narration')).toHaveCSS('opacity', '1')
  await expect(popup.locator('.tour-narration')).not.toHaveAttribute('inert', '')

  const initial = (await popup.boundingBox())!
  const grip = (await handle.boundingBox())!
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
  await page.mouse.down()
  await page.mouse.move(grip.x - 300, grip.y + 150, { steps: 8 })
  await page.mouse.up()
  const moved = (await popup.boundingBox())!
  expect(moved.x).toBeLessThan(initial.x - 250)
  expect(moved.y).toBeGreaterThan(initial.y + 100)
  await opacity.fill('61')
  await page.getByRole('button', { name: 'Next stop' }).click()
  await expect(opacity).toHaveValue('61')
  expect((await popup.boundingBox())!.x).toBe(moved.x)
  await handle.focus()
  await handle.press('ArrowLeft')
  expect((await popup.boundingBox())!.x).toBe(moved.x - 10)
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-moving', 'false')
  await page.screenshot({ path: 'test-results/tour-popup-desktop.png' })
  const currentGrip = (await handle.boundingBox())!
  await page.mouse.move(currentGrip.x + 18, currentGrip.y + 18)
  await page.mouse.down()
  await page.mouse.move(-200, -200, { steps: 5 })
  expect((await popup.boundingBox())!.x).toBe(8)
  expect((await popup.boundingBox())!.y).toBe(8)
  await page.mouse.move(1600, 1100, { steps: 5 })
  await page.mouse.up()
  const corner = (await popup.boundingBox())!
  expect(corner.x + corner.width).toBeLessThanOrEqual(1432)
  expect(corner.y + corner.height).toBeLessThanOrEqual(892)

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(async () => {
      const bounds = (await popup.boundingBox())!
      return bounds.x >= 8 && bounds.y >= 8 && bounds.x + bounds.width <= viewport.width - 8 && bounds.y + bounds.height <= viewport.height - 8
    }).toBe(true)
    await expect(opacity).toBeVisible()
    await page.screenshot({ path: `test-results/tour-popup-${viewport.width}.png` })
  }
  await popup.getByRole('button', { name: 'Exit tour', exact: true }).click()
  await expect(popup).toHaveCount(0)
})

test('all eight lessons have working interactive controls', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore & Learn', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Explore and Learn' })).toBeVisible()
  await page.getByLabel('Imagined fusion rate').fill('4')
  await expect(page.locator('.lesson-result')).toContainText('4x energy')
  await page.getByRole('button', { name: '02 Planet Sizes' }).click()
  await page.getByLabel('First comparison planet').selectOption('mars')
  await expect(page.locator('.size-comparison')).toContainText('6,779 km')
  await page.getByRole('button', { name: '03 Planet Distances' }).click()
  await page.getByLabel('Distance from the Sun').fill('30')
  await expect(page.locator('.lesson-result')).toContainText('249.5 minutes')
  await page.getByRole('button', { name: '04 Gravity' }).click()
  await page.getByLabel('Central mass').fill('4')
  await expect(page.locator('.lesson-result')).toContainText('4.00x')
  await page.getByRole('button', { name: '05 Day and Night' }).click()
  await page.getByLabel('Earth rotation').fill('6')
  await expect(page.locator('.lesson-result')).toContainText('6.0 hours')
  await page.getByRole('button', { name: '06 Seasons' }).click()
  await page.locator('#season-position').fill('1')
  await expect(page.locator('.hemispheres')).toContainText('Summer')
  await page.getByRole('button', { name: '07 Moon Phases' }).click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await expect(page.locator('.moon-phase-diagram')).toContainText('New Moon')
  await page.getByRole('button', { name: '08 Orbits' }).click()
  await page.getByRole('button', { name: 'Remove the gravitational pull' }).click()
  await expect(page.locator('.orbit-lesson')).toHaveClass(/released/)
  await page.screenshot({ path: 'test-results/learning.png' })
})

test('experiments and mission flight controls work', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'What if?', exact: true }).click()
  for (const title of ['What if Earth had two moons?', 'What if Earth were Jupiter-sized?', 'What if the Sun disappeared?', 'What if Earth stopped rotating?']) {
    await page.getByRole('button', { name: new RegExp(title.replace('?', '\\?')) }).click()
    await expect(page.locator('.experiment-explanation')).toBeVisible()
  }
  await page.getByRole('button', { name: 'Restore our solar system' }).click()
  await page.getByRole('button', { name: 'Missions', exact: true }).click()
  await page.getByRole('button', { name: 'Launch mission' }).click()
  await expect(page.locator('.mission-status')).toContainText('Autopilot')
  const accelerate = page.getByRole('button', { name: 'Accelerate spacecraft' })
  await accelerate.focus()
  await page.keyboard.down('Enter')
  await expect(page.locator('.mission-status')).toContainText('Manual flight')
  await page.keyboard.up('Enter')
  await page.getByRole('button', { name: 'Autopilot', exact: true }).click()
  await expect(page.locator('.mission-status')).toContainText('Autopilot')
  await page.getByRole('button', { name: 'Follow orbit', exact: true }).click()
  await expect(page.locator('.mission-status')).toContainText('orbital path')
  await page.getByRole('button', { name: 'End mission' }).click()
  await expect(page.getByRole('button', { name: 'Launch mission' })).toBeVisible()
})

test('responsive screenshots and mobile interaction', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  for (const [width, height] of [[1920, 1080], [1280, 720], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await expect(page.locator('canvas')).toHaveAttribute('data-camera-moving', 'false')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const litPixels = await page.locator('.scene canvas').evaluate(canvas => {
      const renderer = (canvas as HTMLCanvasElement).getContext('webgl2')!
      const pixels = new Uint8Array(64 * 64 * 4)
      renderer.readPixels(Math.floor(canvas.width / 2) - 32, Math.floor(canvas.height / 2) - 32, 64, 64, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
      return pixels.filter((value, index) => index % 4 !== 3 && value > 35).length
    })
    expect(litPixels).toBeGreaterThan(100)
    await page.screenshot({ path: `test-results/overview-${width}.png` })
  }
  await page.locator('.index-item').filter({ hasText: 'Earth' }).click()
  await expect(page.getByRole('complementary', { name: 'Earth information' })).toBeVisible()
  const bounds = await page.locator('.planet-panel').boundingBox()
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThan(844)
  await expect(page.locator('.scene canvas')).toHaveAttribute('data-camera-moving', 'false')
  const planetPixels = await page.locator('.scene canvas').evaluate(canvas => {
    const renderer = (canvas as HTMLCanvasElement).getContext('webgl2')!
    const pixels = new Uint8Array(40 * 40 * 4)
    renderer.readPixels(Math.floor(canvas.width / 2) - 20, Math.floor(canvas.height * .8) - 20, 40, 40, renderer.RGBA, renderer.UNSIGNED_BYTE, pixels)
    return pixels.filter((value, index) => index % 4 !== 3 && value > 20).length
  })
  expect(planetPixels).toBeGreaterThan(100)
  await page.screenshot({ path: 'test-results/mobile-earth.png' })
  await page.getByRole('button', { name: 'Close planet information' }).click()
  await page.getByRole('button', { name: 'Explore & Learn', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'The Sun', exact: true })).toBeVisible()
})

test('WebGL fallback preserves access to planet facts', async ({ page }) => {
  await page.goto('/?fallback')
  await expect(page.getByRole('region', { name: '2D solar system fallback' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.locator('.fallback-planets').getByRole('button', { name: 'Mars', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Mars information' })).toBeVisible()
})

test('recovers from WebGL context loss without a blocking loading screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.scene canvas').evaluate(canvas => (canvas as HTMLCanvasElement).getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext())
  await expect(page.getByRole('region', { name: '2D solar system fallback' })).toBeVisible()
  await expect(page.locator('.loading-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'Earth 03', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Earth.' })).toBeVisible()
})