# Build an Extraordinary Interactive 3D Solar System Website

You are an expert frontend engineer, creative developer, 3D graphics programmer, UI/UX designer, and science-education designer.

Build a **beautiful, immersive, interactive 3D Solar System website** that I can use to teach and amaze my children.

This should NOT feel like a basic Three.js demo.

It should feel like a polished, modern, museum-quality interactive space experience — something that children can explore themselves while also learning real astronomy.

## 1\. Technology

Use a modern React-based architecture.

Preferred stack:

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- @react-three/drei
- Zustand or another lightweight state-management solution
- Framer Motion or another appropriate animation library for the HTML/UI layer
- Tailwind CSS or another clean styling solution
- Three.js post-processing where appropriate

Use React Three Fiber for the primary 3D scene. React Three Fiber is specifically designed as a React renderer for Three.js and allows the 3D scene to be composed from reusable React components.  GitHub

Use Three.js features intelligently for lighting, materials, particles, camera movement, animation, and post-processing.  Three.js+1

Do not introduce unnecessary dependencies.

Prefer procedural/generated graphics where practical instead of requiring large external image assets.

## 2\. Core Experience

The homepage should immediately display an impressive animated Solar System.

The scene should contain:

- The Sun
- Mercury
- Venus
- Earth
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Earth's Moon
- Orbital paths
- Stars/background space
- Subtle nebula/cloud effects
- Asteroid belt
- Optional comets

The planets should continuously orbit the Sun.

The Sun should look luminous and alive rather than like a simple yellow sphere.

Planets should rotate on their axes.

Earth should have:

- Blue oceans
- Green/brown land
- Atmospheric glow
- Cloud layer if performance permits
- Day/night lighting
- Moon orbiting Earth

Saturn must have a visually impressive ring system.

Jupiter should have visible atmospheric banding and a Great Red Spot.

Use scientifically sensible relative orbital directions and relationships.

## 3\. IMPORTANT: Visual Scale

Do NOT use mathematically accurate physical scale for everything because that would make the planets impossible to see.

Instead implement a deliberately designed **"Educational Scale"**.

Provide a UI control allowing the user to change between:

- Educational Scale
- Relative Size
- Distances Emphasized
- Custom

Make the UI explain that the visualization is not to scale.

The objective is educational clarity, not strict physical scale.

## 4\. Camera

Implement a beautiful orbit camera.

Users must be able to:

- Rotate around the Solar System
- Zoom in/out
- Pan
- Focus on individual planets
- Double-click a planet to focus on it
- Return to the complete Solar System view

When a planet is selected, smoothly animate the camera toward it.

Never teleport the camera abruptly.

Use cinematic easing.

Provide:

- "View Solar System"
- "View Planet"
- "Follow Planet"

modes.

## 5\. Planet Interaction

Every planet should be interactive.

When the mouse hovers over a planet:

- Highlight it subtly
- Display its name
- Show a small elegant tooltip
- Slightly increase visual emphasis

When clicked:

Open a beautiful information panel containing:

- Planet name
- Type
- Diameter
- Distance from Sun
- Length of year
- Length of day
- Number of moons
- Temperature
- Interesting facts
- A "Did you know?" section

Use child-friendly language.

For example:

"Jupiter is so big that more than 1,000 Earths could fit inside it."

Do not overload children with scientific jargon.

## 6\. Educational Mode

Create a dedicated **Explore & Learn** experience.

Include interactive lessons such as:

### The Sun

Explain:

- What the Sun is
- Why it shines
- Nuclear fusion
- Why planets orbit it

### Planet Sizes

Allow children to compare planets directly.

For example:

Earth vs Jupiter.

Animate the comparison.

### Planet Distances

Show how far planets actually are from the Sun.

### Gravity

Create a simple interactive gravity demonstration.

Allow the child to change the mass of an object and see the effect.

### Day and Night

Zoom into Earth and demonstrate Earth's rotation.

### Seasons

Demonstrate Earth's axial tilt and explain seasons.

### Moon Phases

Show the Moon orbiting Earth and demonstrate:

- New Moon
- Crescent
- First Quarter
- Gibbous
- Full Moon

### Orbits

Explain:

"Gravity keeps planets moving around the Sun."

Use visual arrows and animations.

## 7\. Time Controls

Create a prominent but elegant time-control panel.

Controls:

- Pause
- Play
- Slow
- Normal
- Fast
- Very Fast

Allow users to change simulation speed.

For example:

1 second = 1 simulated day

and much faster modes.

Display:

"Simulation speed: 365×"

Make the current simulated date visible.

Allow the user to advance time.

## 8\. Cinematic Mode

Create a "Cinematic Tour" button.

When activated, the application automatically takes the user on a spectacular guided tour.

Example sequence:

1. Start with a view of the entire Solar System.
2. Fly toward the Sun.
3. Explain the Sun.
4. Travel past Mercury.
5. Travel past Venus.
6. Approach Earth.
7. Zoom toward Earth.
8. Show the Moon.
9. Travel toward Mars.
10. Dramatically reveal Jupiter.
11. Fly past Saturn and its rings.
12. Continue to Uranus.
13. Continue to Neptune.
14. Zoom back out to the complete Solar System.

Each stage should display short educational narration/text.

The camera movement should feel cinematic and smooth.

Provide:

- Pause tour
- Resume
- Skip
- Exit tour

## 9\. "What If?" Mode

Add a playful experimental section.

Examples:

### What if Earth had two moons?

Add a second moon and visualize the result.

### What if Earth were the size of Jupiter?

Visually compare them.

### What if the Sun disappeared?

Show an educational visualization explaining that the planets would no longer receive sunlight and that gravitational effects propagate at the speed of light.

### What if Earth stopped rotating?

Create a visual explanation.

Clearly label these as **educational simulations**, not real predictions.

## 10\. Spacecraft Mode

Add a small spacecraft that the user can control.

Allow the child to:

- Fly around the Solar System
- Approach planets
- Follow orbital paths
- Visit planets

Use simple controls.

Display:

- Speed
- Distance from Sun
- Current destination

Add a "Mission Control" UI.

## 11\. Stars

Create a beautiful procedural star field.

Requirements:

- Thousands of stars
- Different sizes
- Slight color variation
- Subtle twinkling
- Different depth layers

Do not make the stars distract from the planets.

## 12\. Visual Design

The overall visual design should feel like:

- NASA-inspired
- Futuristic
- Cinematic
- Premium
- Educational
- Child-friendly
- Magical

Use a dark space background.

Color palette:

- Near-black
- Deep navy
- Electric blue
- Purple
- Cyan
- Warm solar orange
- White

Use glassmorphism sparingly for UI panels.

Avoid excessive gradients and excessive glowing effects.

The 3D scene must remain the visual focus.

## 13\. UI

Create a polished responsive interface.

Desktop:

- Large immersive 3D viewport
- Floating controls
- Planet information panel
- Bottom timeline
- Top navigation

Tablet:

- Simplified controls
- Touch-friendly interactions

Mobile:

- Full-screen 3D experience
- Large touch controls
- Bottom sheets for information
- Avoid tiny buttons

Make every interaction usable with both mouse and touch.

## 14\. Accessibility

Implement:

- Keyboard navigation
- Visible focus states
- High contrast text
- Reduced-motion option
- Screen-reader-friendly HTML UI
- Buttons with accessible labels

Provide a:

"Reduce Motion"

setting that substantially reduces camera movement, automatic animation, and visual effects.

## 15\. Performance

This is extremely important.

The application must remain smooth on an average modern laptop.

Implement:

- Efficient geometry
- Instancing where appropriate
- Texture optimization
- Lazy loading
- Suspense where useful
- Adaptive pixel ratio
- Reasonable particle counts
- Frustum culling where appropriate
- Avoid unnecessary React re-renders
- Reuse materials and geometries
- Dispose resources correctly

Do not render thousands of React components unnecessarily.

Use Three.js/R3F animation mechanisms appropriately.

Three.js supports animation of transforms, materials, visibility, and other properties, so use the rendering layer rather than causing excessive React state updates every frame.  Three.js

## 16\. Rendering

Prefer WebGL for broad compatibility.

If you introduce WebGPU as an optional enhancement, implement graceful fallback to WebGL.

The application must still work if WebGPU is unavailable.

React Three Fiber's current documentation notes that Three.js has a WebGPU renderer but that it is not fully backward-compatible with all Three.js features, so do not make WebGPU a hard requirement.  GitHub

## 17\. Sound

Add optional ambient space audio.

Include:

- Very subtle ambient background
- Optional UI interaction sounds
- Optional cinematic sounds

Audio must be OFF by default or require an explicit user interaction before playback.

Provide a mute button.

Do not make the application annoying or noisy.

## 18\. Facts and Data Architecture

Do not hard-code planetary information throughout React components.

Create a structured data model.

For example:

```
type Planet = {
  id: string
  name: string
  type: string
  diameterKm: number
  distanceFromSunKm: number
  orbitalPeriodDays: number
  rotationPeriodHours: number
  moons: number
  temperatureC: number
  color: string
  description: string
  facts: string[]
}
```

Keep scientific data separate from presentation.

Make it easy to add additional objects later.

## 19\. Architecture

Organize the project cleanly.

Suggested structure:

```
src/
  components/
    3d/
      SolarSystem.tsx
      Sun.tsx
      Planet.tsx
      Moon.tsx
      Orbit.tsx
      AsteroidBelt.tsx
      StarField.tsx
      Spacecraft.tsx
      CameraController.tsx

    ui/
      Header.tsx
      PlanetPanel.tsx
      TimeControls.tsx
      SimulationControls.tsx
      MissionControl.tsx
      TourControls.tsx
      Tooltip.tsx
      SettingsPanel.tsx

  data/
    planets.ts
    facts.ts
    missions.ts

  store/
    simulationStore.ts

  hooks/
    useSimulationTime.ts
    usePlanetFocus.ts
    useKeyboardControls.ts

  scenes/
    SolarSystemScene.tsx

  utils/
    astronomy.ts
    scale.ts

  App.tsx
  main.tsx
  index.css
```

Adapt this structure if you have a better architectural approach.

## 20\. State Management

Centralize important application state.

At minimum manage:

- Selected planet
- Camera target
- Simulation speed
- Simulation date
- Paused/running
- Educational mode
- Cinematic tour state
- UI panels
- Sound enabled
- Reduced motion
- Scale mode

Avoid prop-drilling large amounts of state.

## 21\. Realistic Planet Rendering

Do not use identical spheres with different colors.

Each planet should have its own visual identity.

Examples:

Mercury:

- Rocky
- Dark gray
- Craters

Venus:

- Yellow/cream
- Dense cloudy atmosphere

Earth:

- Ocean
- Continents
- Clouds
- Atmosphere

Mars:

- Red/orange
- Rocky

Jupiter:

- Strong atmospheric bands
- Great Red Spot

Saturn:

- Gas giant
- Detailed rings

Uranus:

- Pale cyan

Neptune:

- Deep blue
- Atmospheric details

The Sun:

- Bright emissive surface
- Animated solar texture
- Corona
- Subtle solar flares
- Point light illuminating the planets

## 22\. Atmospheres

Add atmospheric glow where appropriate.

Earth should have a blue atmospheric rim.

Venus should have a subtle hazy atmosphere.

Gas giants should have subtle atmospheric effects.

Keep these effects performant.

## 23\. Planet Labels

Provide a toggle:

"Planet Labels"

When enabled, show elegant labels for planets.

Labels should scale appropriately and avoid excessive overlap.

Allow labels to fade based on camera distance.

## 24\. Educational Accuracy

Use sensible astronomy values.

Do not invent scientific claims.

Where exact values aren't necessary, use rounded values and explain that they are approximate.

Do not pretend the visual simulation is physically exact.

Clearly distinguish:

- Real astronomical data
- Simplified educational models
- Hypothetical simulations

## 25\. Easter Eggs

Add several fun discoveries.

Examples:

- Click the Sun several times → solar flare effect
- Click Earth → "Hello, Earth!"
- Find a hidden comet
- A tiny spacecraft occasionally passes through the scene
- A "Random Fact" button
- "Surprise Me" camera mode

Keep Easter eggs tasteful.

## 26\. Random Fact System

Create a "Teach Me Something!" button.

Every click displays a new astronomy fact.

Examples:

- "A day on Venus is longer than a year on Venus."
- "Jupiter is the largest planet in our Solar System."
- "Saturn's rings are mostly made of ice and rock."
- "Light from the Sun takes about 8 minutes to reach Earth."

Use a large, beautiful animated card.

## 27\. Loading Experience

Create a beautiful loading screen.

Show:

"Preparing the Solar System..."

Animate:

- Tiny stars
- Orbit lines
- A miniature Sun

Display loading progress if possible.

Do not leave the user staring at a blank screen.

## 28\. Error Handling

If WebGL is unavailable:

Display a polished fallback screen explaining:

"Your browser or graphics hardware cannot display the 3D Solar System."

Provide a simplified 2D Solar System fallback if reasonably practical.

Do not let WebGL errors crash the entire React application.

## 29\. Responsive Quality

The website must look intentionally designed at:

- 1920×1080
- 1440×900
- 1280×720
- iPad/tablet
- modern phone

Do not merely shrink the desktop layout.

## 30\. Code Quality

Write production-quality TypeScript.

Requirements:

- Strict typing
- No unnecessary `any`
- Reusable components
- Clean naming
- Small focused components
- Comments only where useful
- No giant monolithic App component
- No duplicated logic
- No fake placeholder functionality

Do not leave TODOs for core functionality.

## 31\. Development Workflow

Before writing code:

1. Inspect the existing repository.
2. Determine whether a React/Vite application already exists.
3. Reuse the existing project where appropriate.
4. Do not destroy existing functionality without a reason.
5. Install only necessary dependencies.
6. Build incrementally.
7. Run the application.
8. Check for TypeScript errors.
9. Check for lint/build errors.
10. Fix errors before considering the task complete.

If the project is empty, initialize an appropriate React + TypeScript + Vite project.

## 32\. Testing

Test:

- Application startup
- Production build
- Planet selection
- Camera controls
- Time controls
- Pause/resume
- Cinematic tour
- Educational panels
- Mobile layout
- Keyboard controls
- Reduced-motion mode
- WebGL failure handling

Make sure there are no console errors.

## 33\. Final Experience

The first 10 seconds matter.

When the website opens, the user should immediately see:

A breathtaking animated Solar System floating in deep space.

The Sun should glow.

The planets should move.

Stars should drift subtly.

The camera should have a beautiful composition.

A small message should appear:

"Welcome to the Solar System"

Then:

"Drag to explore • Click a planet to learn • Start a mission"

The experience should make a child immediately want to click something.

## 34\. Most Important Requirement

Do not optimize for simply satisfying the feature checklist.

Optimize for:

**WOW + EDUCATION + INTERACTION + BEAUTY.**

I want my children to look at the screen and say:

"Whoa!"

Then immediately start asking:

"What's that?"

"How big is Jupiter?"

"Why does Saturn have rings?"

"How far away is Neptune?"

"Can I fly there?"

The website should encourage exactly that kind of curiosity.

## 35\. Deliverables

Build the complete working application.

At the end:

1. Ensure it runs locally.
2. Ensure the production build succeeds.
3. Give me the exact command to start it.
4. Give me the exact command to build it.
5. Briefly explain the architecture.
6. List the major interactive features implemented.
7. Mention any compromises made for performance or scientific scale.
8. Do not merely give me a code sample — actually implement the application in the repository.

**"Do not ask me for confirmation between implementation steps. Make reasonable engineering decisions yourself, implement the complete application, run it, inspect the result, and fix problems autonomously."**