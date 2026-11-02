I owe you a correction — **the numbers in my first annotation were misplaced.** My "source point" solver iterated a fixed point (`K(n) = n`) that doesn't actually exist once the wind bends the axis, so it wandered and dropped some numbers in the wrong places. That's why 1/6 and 3/7 looked coincident. I re-found each source by searching for where its envelope actually peaks, and re-rendered (`~\AppData\Local\Temp\opencode\term_swell_dominance.png`).

## The real positions

| # | base axis (lat/lon) | true source | flagged pair | real separation |
|---|---|---|---|---|
| 1 | −29 / −79 | −1 / −51 | **1 ↔ 6** | **58°** (base 44°) |
| 2 | −52 / 101 | −14 / 63 | | |
| 3 | 72 / −24 | 60 / 12 | **3 ↔ 7** | **34°** (base 65°) |
| 4 | 5 / 39 | 14 / 65 | | |
| 5 | −16 / 16 | 19 / 44 | | |
| 6 | −49 / −28 | −22 / 11 | | |
| 7 | 14 / −74 | 54 / −51 | | |
| 8 | 43 / −165 | 84 / 63 | | |

So **1 and 6 are 58° apart and 3 and 7 are 34° apart** — not close. The genuinely closest pair is **4 ↔ 5 at 21°** (30° before the wind). My apologies for the misleading first picture.

## So why *is* there any clustering?

Two effects, and only one of them is the one you'd guess:

1. **The base placement is already a bit tight.** The eight components sit on the same 32-slot spiral, offset by `fi × 5` slots. A Fibonacci spiral of 32 points has a minimum spacing of ~36°, so the eight are at best ~36° apart — not the ~70° that eight evenly-spread points *could* have. The small per-component jitter (±8°) can shave that to ~30°.

2. **The wind bend is the real culprit.** Each axis is bent toward the local wind: `K = normalize(K0 + 0.9·windDir)`. That bend reaches **~64°** (not the 42° I quoted earlier — that was only the worst case at 90°; it peaks near 150°). So it can pull two axes together — that's what drops 4↔5 from 30° to 21°, and 3↔7 from 65° to 34° — or push them apart (1↔6 went 44° → 58°). It's location-dependent, because `windDir` varies.

So: the spiral keeps them ~36° apart, and the wind rearranges them from there — sometimes closer.

## You're right that further apart would look better

Three ways to do it, in increasing effort:

- **Lower `windAmount`** (0.9 → ~0.4): less regional bending, so the axes stay near their spread spiral slots. Cheap, but you lose some of the regional wave-direction variety.
- **Widen the base offset**: change the `fi * 5` in the slot to spread the eight across the whole spiral more evenly (e.g., a larger effective offset), so they start closer to the ideal ~70°.
- **Add a cross-component repulsion** in the shader: after computing the eight axes, nudge any pair closer than a threshold apart. Most robust, and it guarantees a minimum separation regardless of the wind — but it's the biggest change.

Want me to implement one of these? I'd suggest the repulsion if you want a guaranteed spread, or just dropping `windAmount` if you want a quick look.