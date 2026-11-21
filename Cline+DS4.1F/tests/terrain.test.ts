import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/3d/terrain.ts', import.meta.url), 'utf8')
function shaderChunk(name: string): string {
  const match = source.match(new RegExp(`export const ${name} = /\\* glsl \\*/ \`([\\s\\S]*?)\``))
  assert.ok(match, `${name} is an exported GLSL template`)
  return match[1]
}

// Node cannot execute the GLSL, so these source-level checks pin the coastal
// clipping contract and the single declarations needed by both materials that
// inject the vertex chunks (the planet and its night lights).
test('layered water clips only above-sea fragments in real water', () => {
  const clip = shaderChunk('SEAFLOOR_COAST_CLIP')
  assert.match(clip, /uLayeredWater > 0\.5 && uBathyEnabled > 0\.5 && vSurfaceRadius > 1\.000001/)
  assert.match(clip, /water >= 0\.004 && bathyTexel > 0\.0/)
  assert.match(clip, /discard/)
  const displacement = shaderChunk('SEAFLOOR_VERTEX_DISPLACE')
  assert.match(displacement, /vSurfaceRadius = length\(transformed\)/)
})

test('terrain and seafloor vertex chunks declare their shared uniforms exactly once', () => {
  const declarations = `${shaderChunk('TERRAIN_VERTEX_PARS')}\n${shaderChunk('SEAFLOOR_VERTEX_PARS')}`
  for (const uniform of ['uWaterMask', 'uSeawaterOpacity', 'uBathyEnabled']) {
    assert.equal(declarations.match(new RegExp(`uniform (?:sampler2D|float) ${uniform};`, 'g'))?.length, 1)
  }
})
