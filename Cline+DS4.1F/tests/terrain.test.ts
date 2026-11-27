import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const terrain = readFileSync(new URL('../src/components/3d/terrain.ts', import.meta.url), 'utf8')
const planet = readFileSync(new URL('../src/components/3d/Planet.tsx', import.meta.url), 'utf8')
const overlay = readFileSync(new URL('../src/components/3d/earthMapShader.ts', import.meta.url), 'utf8')

function shaderChunk(name: string): string {
  const match = terrain.match(new RegExp(`export const ${name} = /\\* glsl \\*/ \`([\\s\\S]*?)\``))
  assert.ok(match, `${name} is an exported GLSL template`)
  return match[1]
}

test('Volumetric terrain uses the filtered field and conservative coast weight', () => {
  const displacement = shaderChunk('TERRAIN_VERTEX_DISPLACE')
  assert.match(displacement, /float landOffset = terrainHeight \* uTerrainScale \+ uTerrainBias/)
  assert.match(displacement, /if \(uLayeredWater > 0\.5\)/)
  assert.match(displacement, /terrainFieldUv\(uv, uTerrainMesh\)/)
  assert.match(displacement, /\(filteredHeight \* uTerrainScale \+ uTerrainBias\) \* coastWeight/)
  assert.doesNotMatch(displacement, /discard|COAST_BACKING/)
})

test('terrain and seafloor vertex declarations remain unique', () => {
  const declarations = `${shaderChunk('TERRAIN_VERTEX_PARS')}\n${shaderChunk('SEAFLOOR_VERTEX_PARS')}`
  for (const uniform of [
    'uTerrainHeightField',
    'uTerrainCoastWeight',
    'uTerrainMesh',
    'uLayeredWater',
    'uWaterMask',
    'uSeawaterOpacity',
    'uBathyEnabled',
  ]) {
    assert.equal(
      declarations.match(new RegExp(`uniform (?:sampler2D|vec2|float) ${uniform};`, 'g'))?.length,
      1,
      uniform,
    )
  }
})

test('geometry and its derived field are selected from the same render tier', () => {
  assert.match(planet, /const sphereGeometry = SPHERE_LODS\[sphereTier\]/)
  assert.match(planet, /const terrainLevel = terrainFields\?\.levels\[sphereTier\] \?\? null/)
  assert.match(planet, /uniforms\.uLayeredWater\.value = terrainLevel && seawaterMode\.layeredWater \? 1 : 0/)
  assert.doesNotMatch(terrain, /SEAFLOOR_COAST_CLIP|COAST_BACKING/)
  assert.doesNotMatch(planet, /coastBackingMaterial/)
})

test('the overlay interpolates final corner coefficients rather than averaging first', () => {
  assert.match(overlay, /return vec2\(height \* weight, weight\)/)
  assert.match(overlay, /ground\.x \* uTerrainScale \+ ground\.y \* uTerrainBias/)
  assert.match(overlay, /sphereA\.x \+= 0\.5 \/ columns/)
  assert.match(overlay, /sphereC\.x -= 0\.5 \/ columns/)
})
