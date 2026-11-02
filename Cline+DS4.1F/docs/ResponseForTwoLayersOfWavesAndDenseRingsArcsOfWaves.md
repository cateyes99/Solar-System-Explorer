# Prompt:

In this 3D Earth animation, I think we might be talking about different things. When `chopDrift` is set to 10, I can see a top layer of water flowing noticeably fast across the entire ocean surface. This flow speed is presumably controlled by `chopDrift` (the 'chop' parameter we discussed, right)? Beneath it, however, I see denser patterns—mostly circular loops made up of many ring-like textures with irregular curves around them—which are constantly and dynamically changing. These circular patterns appear to cycle mostly in place with very little displacement. When `chopDrift` is set to 0, that top flowing layer practically disappears, while these dynamic, dense circular patterns become very prominent. These effects are especially clear in the ocean areas with sun specular highlights. What are these underlying patterns? They look quite bad for wave animation. Can we add a control parameter for them? If so, please introduce a variable to adjust their intensity: setting it to 0 should completely disable them, the current look should be the default, and you can set an appropriate maximum limit. Once implemented, let me know how to control it so I can tweak and test the results myself.

# Response:

You're right that we were talking about different things — and I can now name both.

## The two layers

| what you see | what it is | controlled by |
|---|---|---|
| **"top layer flowing across the surface"** | the **fine chop** — isotropic 3D value-noise, advected | `chopDrift` (speed), `chopFlow`/`chopFlowRate` (wander) |
| **"dense circular loops / ring-like textures"** | the **swell** — the directional spectrum: the eight plane waves' crests, which are **arcs and rings on the sphere** | **new: `swellIntensity`** |

I confirmed it by rendering the two terms at a close zoom: the **swell term alone is exactly that dense field of loops and irregular rings**, and it's unchanged whether the crest warp is on or off — so it's the plane waves themselves, not the warp. It's always there; the flowing chop just visually masks it, which is why it "becomes prominent" when you set `chopDrift: 0`.

## New knob: `swellIntensity`

In `BODY_VISUALS.earth.water.wave` (`src/data/visuals.ts`, ~line 706):

```ts
swell: 0.36,
// A multiplier on the swell — the directional spectrum's dense ring/crest
// pattern. 0 = no swell at all (pure chop); 1 = the shipped look.
swellIntensity: 1, // 0–2
```

It multiplies the swell amplitude in the shader:

```glsl
float amp = uWaveSwell * uWaveSwellIntensity * windStrength / (1.0 + fi * 0.9) * ...
```

| `swellIntensity` | effect |
|---|---|
| `0` | **swell completely gone** — only the fine chop remains (no crests/rings) |
| `0.3` | faint rings, mostly chop — the ring pattern is subdued |
| `1` | **shipped look** (default) |
| `1.5–2` | heavier, more banded sea |

Save and **hard-reload (Ctrl+Shift+R)**.

## Suggested test

Try `swellIntensity: 0` first — you'll see the ring pattern vanish and only the flowing chop remain, which confirms the identification. Then walk it up (0.3 → 0.6 → 1) to find where the rings read as waves rather than noise. Combined with `chopDrift`, you can now balance the two layers independently: high `chopDrift` + low `swellIntensity` = a fast flowing texture with few rings; low `chopDrift` + high `swellIntensity` = a calm, ring-dominated sea.

One honest caveat: at `swellIntensity: 0` there are no wave crests at all, so the surface is pure isotropic chop — it will look flat/featureless rather than like a sea. It's a diagnostic and a tuning extreme, not a look you'd likely ship.

Files: `src/components/3d/water.ts`, `src/data/visuals.ts`. Typecheck, 44/44 tests and the build are clean.