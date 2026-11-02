# Prompt:

In the Volumetric mode of this 3D Earth animation, under the Spectral option, I noticed distinct, irregular stripe-like patterns in the ocean waves. Are these caused by wave sources like the 'poles of the plane waves'?

Also, there are lumpy, bulging wave shapes scattered everywhere. How are these formed? Are they simply the appearance of those irregular wave systems from earlier when viewed away from direct sun specular highlights?

Am I correct in my assumptions?

# Response:

Good questions — and the answers are in the shader, so let me be precise. "Spectral" is the default **Wave model** (`data/waveStyles.ts`), and its surface normal is the sum of **two independent terms** (`water.ts:620`):

```glsl
vec3 gObj = swellGrad + chopGrad;
```

## 1. The stripe-like patterns → the directional swell

`swellGrad` is the **directional spectrum**: eight plane waves, each contributing

```glsl
swellGrad += (amp * kBase * cos(phase)) * KTangent;   // water.ts:607
```

The tilt oscillates *along* `KTangent`, so the crests are lines of constant `dot(n, K)` — circles on the sphere. That is a **banded/striped** field. They look irregular (not clean concentric rings) because of the shared **crest warp** (`warp * warpAmount * kBase`, water.ts:606), which offsets each component's phase so the wavefronts wander.

So on your first assumption — **you're partly right**:
- The stripes **are** the plane-wave swells (the directional spectrum).
- The **poles are not the *cause*** of the stripes; they are the **degenerate centres** of each stripe system — the point where the wave vector `K` lines up with the surface normal and the crests collapse. Two lines of code act there:
  - `poleFade` (water.ts:588) dims each component *at* its pole;
  - `sourceFalloff = exp(-(1 - dot(n,K)) * 2.4)` (water.ts:593) gathers each system *around* its pole — which is exactly why a stripe system reads as a "source" with a home region rather than stripes everywhere.

## 2. The lumpy, bulging shapes → mostly the fine chop (a *different* term)

`chopGrad` is the gradient of `oceanChop` (water.ts:337–341): 3D **value-noise fBm** (three rotated octaves) advected through time. Noise has **no preferred direction**, so it reads as isotropic **lumps/bulges**, not stripes.

So on your second assumption — **not quite**. The lumps are *not* the same wave systems seen away from the specular highlight. The specular/diffuse change only affects *which slopes catch light*; the underlying normal is the sum of two different fields, and the lumps come mainly from the noise chop. That said, there are two **secondary** lumpy contributors from the swell side, so the split isn't perfectly clean:
- the eight directional systems **interfere** (beat) where they overlap, giving a cellular pattern; and
- each system is enveloped by the `sourceFalloff` blob, so a source's region reads as a large lump of stripes.

(How much of each you see also depends on scale: the source blobs span roughly ±60–90°, while the chop features are ~7–27°.)

## How to prove it to yourself

All three are config knobs in `BODY_VISUALS.earth.water.wave` (`src/data/visuals.ts`, ~line 634):

| Set this | If the … disappear, they were … |
|---|---|
| `maxChop: 0` | fine lumps vanish, stripes remain → the **noise chop** |
| `sourceFalloff: 0` | large lumps vanish → the **source blobs** (swell envelope) |
| `warpAmount: 0` | stripes become clean concentric rings → confirms the **crest warp** |

(These are config-only; save and hard-reload. There's no separate UI slider for chop or falloff — the "Wave intensity" slider scales them together.)

I can't see your render, so I'm reasoning from the shader — but I can render the two terms **separately** (swell-only vs chop-only, in the same equirectangular harness I used before) to show you exactly which pattern each produces. Want me to?