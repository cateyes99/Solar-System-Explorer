# Research and Evaluate a Configurable Ocean Wave Intensity Control

## Background

In the existing 3D Earth animation, the ocean surface already has a wave animation effect. I want to introduce a new control on the Earth control panel that allows users to adjust the overall intensity of this effect.

**Do not implement anything yet. Start by investigating the existing system, conducting research where necessary, and presenting a reasoned technical evaluation.**

## 1\. Proposed Feature

Add a single slider to the Earth control panel with a range of 0% to 100%.

The slider should control the overall intensity of the ocean animation through three related properties:

- **Wave amplitude:** The apparent height and depth of the ocean's undulations.
- **Flow speed:** How quickly the wave patterns move and evolve over time.
- **Wave variability:** The degree of irregularity and dynamic variation in the wave patterns.
- potentially also **the strength of the visual interaction** between waves and the coast.

These properties should be coordinated to produce a coherent visual result. Do not assume that they must scale linearly or proportionally with the slider value.

## 2\. Expected Behavior

- **0% — Completely still:** The ocean animation stops completely. There should be no residual wave movement, drifting patterns, time-dependent surface changes, or no animated coastal interaction.
- **30% — Existing baseline:** The ocean should retain approximately the same visual appearance and behavior as the currently implemented wave effect, with only subtle coastal interaction if it fits the existing visual style. Use the existing implementation as the reference rather than assuming that 30% should equal 30% of every underlying parameter's maximum value.
- **100% — Maximum intensity:** The ocean should exhibit substantially more pronounced and dynamic wave activity and stronger coastal interaction, but no permanent land deformation. Determine a visually appropriate maximum through technical analysis and visual evaluation. The effect must remain coherent and aesthetically pleasing rather than becoming excessively turbulent, noisy, or distracting.

Intermediate slider values should produce smooth, predictable transitions in perceived intensity.

## 3\. Primary Design Priority: Desktop Visual Quality

Desktop visual quality should be the primary consideration.

Evaluate the effect at realistic desktop screen resolutions and across representative globe sizes and viewing angles. Consider:

- Whether the waves are clearly visible without overwhelming the Earth visualization.
- Whether wave amplitude, flow speed, and variability remain visually balanced at different intensity levels.
- Whether the effect remains convincing when the globe is rotated or zoomed.
- Whether the surface exhibits artifacts, flickering, abrupt changes, or unnatural motion.
- Whether rendering performance remains acceptable at high intensity.

Do not optimize for exaggerated wave motion at the expense of the overall quality of the Earth visualization.

## 4\. Research and Technical Investigation

Before proposing an implementation:

1. Inspect the existing project architecture and identify how the ocean surface and wave animation are currently implemented.
2. Determine which existing parameters, shaders, animation loops, or rendering techniques control wave amplitude, movement speed, and variability.
3. Establish a baseline for the existing appearance and identify how it can be preserved at approximately 30%.
4. Research relevant rendering techniques or established approaches if the existing implementation leaves important technical questions unresolved.
5. Evaluate suitable mappings between the slider value and the underlying animation parameters, including nonlinear mappings if they would produce better perceptual results.
6. Consider performance, visual stability, and compatibility with the existing animation system.

Base your recommendations on the actual project implementation and relevant technical evidence. Clearly distinguish verified findings from assumptions or proposals.

## 5\. Required Evaluation

Before implementation, present:

- A summary of the existing implementation and its relevant limitations.
- An assessment of whether a single slider is the right user-interface design.
- A proposed relationship between slider intensity and the three wave properties.
- A reasoned definition of the expected behavior at 0%, 30%, and 100%.
- The main visual-quality and performance risks, particularly on desktop displays.
- Any assumptions, ambiguities, or technically unreasonable aspects of my proposal.
- A recommended approach, including alternatives and their trade-offs where appropriate.

If any part of the proposed design is technically unsound or likely to produce a poor visual result, explain why and recommend a better alternative rather than blindly following the specification.

## 6\. Scope Restriction

This phase is for research, investigation, and design evaluation only.

Do not modify source files, implement the slider, change shader parameters, or otherwise alter the existing project during this phase.

Conclude with a concrete recommendation and a proposed implementation plan. Wait for approval before proceeding to implementation.