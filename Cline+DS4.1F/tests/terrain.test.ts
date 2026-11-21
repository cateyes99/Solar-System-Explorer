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
// displacement contract and the single declarations needed by both materials
// that inject these chunks (the planet and its night lights).
test('revealed seafloor attenuates land relief by the dry fraction of coastal texels', () => {
  const displacement = shaderChunk('TERRAIN_VERTEX_DISPLACE')
  assert.match(displacement, /uBathyEnabled > 0\.5 && uSeawaterOpacity < 0\.999/)
  assert.match(displacement, /texture2D\(uWaterMask, terrainUv\)\.r/)
  assert.match(displacement, /max\(landOffset, 0\.0\) \* \(1\.0 - water\)/)
})

test('terrain and seafloor vertex chunks declare their shared uniforms exactly once', () => {
  const declarations = `${shaderChunk('TERRAIN_VERTEX_PARS')}\n${shaderChunk('SEAFLOOR_VERTEX_PARS')}`
  for (const uniform of ['uWaterMask', 'uSeawaterOpacity', 'uBathyEnabled']) {
    assert.equal(declarations.match(new RegExp(`uniform (?:sampler2D|float) ${uniform};`, 'g'))?.length, 1)
  }
})
