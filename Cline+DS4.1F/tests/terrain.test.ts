import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/3d/terrain.ts', import.meta.url), 'utf8')
const waterSource = readFileSync(new URL('../src/components/3d/water.ts', import.meta.url), 'utf8')
function shaderChunk(name: string): string {
  const match = source.match(new RegExp(`export const ${name} = /\\* glsl \\*/ \`([\\s\\S]*?)\``))
  assert.ok(match, `${name} is an exported GLSL template`)
  return match[1]
}

// Node cannot execute the GLSL, so these source-level checks pin the coastal
// backing/clipping contract and the declarations needed by both materials that
// inject the vertex chunks (the planet and its night lights).
test('a complete opaque backing remains beneath the clipped relief pass', () => {
  const displacement = shaderChunk('SEAFLOOR_VERTEX_DISPLACE')
  assert.match(displacement, /#ifdef COAST_BACKING/)
  assert.match(displacement, /min\(vSurfaceRadius, uWaterSurfaceRadius\) - 0\.00001/)
  assert.match(displacement, /vSurfaceRadius = length\(transformed\)/)

  const clip = shaderChunk('SEAFLOOR_COAST_CLIP')
  assert.match(clip, /#ifndef COAST_BACKING/)
  assert.match(clip, /vSurfaceRadius > uWaterSurfaceRadius \+ 0\.000001/)
  assert.match(clip, /discard/)
})

test('relief clipping and the ocean share their live coverage predicate', () => {
  const clip = shaderChunk('SEAFLOOR_COAST_CLIP')
  assert.match(clip, /waterCovers\(mask, fullDepth, uWaterAlpha, uSeaLevelDrop\)/)
  assert.match(source, /return mask \* alpha >= 0\.004 && fullDepth > drop/)
  assert.match(waterSource, /\$\{WATER_COVERAGE\}/)
  assert.match(waterSource, /if \(!waterCovers\(waterMask, fullDepth, uWaterAlpha, uSeaLevelDrop\)\) discard/)
})

test('terrain and seafloor vertex chunks declare their shared uniforms exactly once', () => {
  const declarations = `${shaderChunk('TERRAIN_VERTEX_PARS')}\n${shaderChunk('SEAFLOOR_VERTEX_PARS')}`
  for (const uniform of ['uWaterMask', 'uSeawaterOpacity', 'uBathyEnabled', 'uWaterSurfaceRadius']) {
    assert.equal(declarations.match(new RegExp(`uniform (?:sampler2D|float) ${uniform};`, 'g'))?.length, 1)
  }
})
