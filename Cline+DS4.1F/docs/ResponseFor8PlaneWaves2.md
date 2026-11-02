You're right, and I measured it — my "eight regions" claim was wrong. Counting the area each system actually owns:

| # | colour | share of the map |
|---|---|---|
| 2 | green | **44.5%** |
| 3 | blue | **33.3%** |
| 1 | red | **18.2%** |
| 5 | magenta | **4.0%** |
| 7 | orange | 0.06% |
| 4 | yellow | 0.00% |
| 6 | cyan | 0.00% |
| 8 | violet | 0.00% |

So only **four** systems own any real area — exactly the four colours you see. The other four dominate essentially nowhere, so their colours never appear (the lone speck of orange is #7's 0.06%).

## Why only four

The map colours each pixel by the **amplitude envelope**, and that envelope is not equal across the eight:

```
weight_i  =  life envelope  ×  waveLod(k_i)  /  (1 + 0.9·i)
                                                  ↑
                                        the spectral falloff
```

The `1/(1 + 0.9·i)` term is the JONSWAP-like spectrum: it makes component 1 about **7× stronger** than component 8, before any position or lifetime is involved. Multiply that by each system's life envelope at this instant and you get:

| # | life env | ÷ (1+0.9i) | effective weight |
|---|---|---|---|
| 2 | 1.00 | 0.53 | **0.53** |
| 3 | 1.00 | 0.36 | **0.36** |
| 1 | 0.25 | 1.00 | **0.25** |
| 5 | 0.99 | 0.22 | **0.22** |
| 7 | 0.63 | 0.16 | 0.10 |
| 6 | 0.30 | 0.19 | 0.06 |
| 4 | 0.14 | 0.27 | 0.04 |
| 8 | 0.00 | 0.14 | 0.00 |

The top four are far ahead of the rest, so wherever they reach, they win — and the bottom four only ever get slivers.

## What this actually tells you

The "eight plane waves" are **not eight equal systems**. They're a *spectrum*: the long-wavelength components carry most of the energy (that's the whole point of the JONSWAP falloff), and the short ones are faint. So a few dominate and the rest are a subtle background texture. That's also part of why you couldn't count "eight waves" in the render — there aren't eight comparable things to see.

If you want to see all eight home regions regardless of strength, I can re-render with each system's envelope **normalised by its own peak** (so every one gets an equal-strength colour). That would show eight regions — but it would exaggerate the faint systems. Want that, or is the honest weighted version more useful?