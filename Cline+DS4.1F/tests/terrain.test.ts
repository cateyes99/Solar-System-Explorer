import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SPHERE_INNER_RADII,
  SPHERE_LODS,
  inscribedSphereRadius,
} from '../src/components/3d/geometry.ts'

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
  assert.match(displacement, /min\(vSurfaceRadius, uWaterInnerRadius\) - 0\.00001/)
  assert.match(displacement, /vSurfaceRadius = length\(transformed\)/)

  const clip = shaderChunk('SEAFLOOR_COAST_CLIP')
  assert.match(clip, /#ifndef COAST_BACKING/)
  assert.match(clip, /vSurfaceRadius > uWaterInnerRadius \+ 0\.000001/)
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
  for (const uniform of ['uWaterMask', 'uSeawaterOpacity', 'uBathyEnabled', 'uWaterSurfaceRadius', 'uWaterInnerRadius']) {
    assert.equal(declarations.match(new RegExp(`uniform (?:sampler2D|float) ${uniform};`, 'g'))?.length, 1)
  }
})

test('coastal clipping covers only the low land-sampling part of a mixed triangle', () => {
  const displacement = shaderChunk('SEAFLOOR_VERTEX_DISPLACE')
  assert.match(displacement, /varying float vCoastWater|vCoastWater =/)
  assert.match(displacement, /float coastCoverage = max\(water, step\(0\.0001, bathyTexel\)\)/)
  assert.match(displacement, /1\.0 - step\(uWaterSurfaceRadius \+ 0\.000001, vSurfaceRadius\)/)

  const clip = shaderChunk('SEAFLOOR_COAST_CLIP')
  assert.match(clip, /bool coastTriangle = uTerrainScale > 0\.0 && uWaterAlpha >= 0\.004 && vCoastWater > 0\.0/)
  assert.match(clip, /bool nearWaterline = 1\.0 \+ max\(landOffset, 0\.0\) <= uWaterSurfaceRadius \+ coastClipHeight/)
  assert.match(clip, /if \(\(coastTriangle && nearWaterline\) \|\| waterClip\) discard/)
})

test('genuinely elevated land survives conservative coastal triangle clipping', () => {
  const declarations = shaderChunk('SEAFLOOR_FRAGMENT_PARS')
  assert.match(declarations, /uniform sampler2D uTerrainMap;/)
  assert.match(declarations, /uniform float uTerrainScale;/)
  assert.match(declarations, /uniform float uTerrainBias;/)

  const clip = shaderChunk('SEAFLOOR_COAST_CLIP')
  assert.match(clip, /const float coastClipHeight = 0\.002;/)
  assert.match(clip, /float landOffset = texture2D\(uTerrainMap, seaUv\)\.x \* uTerrainScale \+ uTerrainBias;/)
  assert.match(clip, /bool elevatedLand = landOffset > coastClipHeight;/)
  assert.match(clip, /bool waterClip = !elevatedLand && waterCovers\(mask, fullDepth, uWaterAlpha, uSeaLevelDrop\);/)
})

test('the backing inset is derived from every water mesh’s actual facets', () => {
  assert.equal(SPHERE_INNER_RADII.length, SPHERE_LODS.length)
  const expected = [null, null, null, 0.9997908417, 0.9999476823, 0.9999868978]
  for (let tier = 0; tier < SPHERE_LODS.length; tier += 1) {
    const radius = SPHERE_INNER_RADII[tier]
    assert.equal(radius, inscribedSphereRadius(SPHERE_LODS[tier]))
    assert.ok(radius > 0.98 && radius < 1)
    const wanted = expected[tier]
    if (wanted !== null) assert.ok(Math.abs(radius - wanted) < 1e-9)
  }
})
