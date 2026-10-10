/** Polished fallback when WebGL is unavailable. */
export function WebGLFallback() {
  return (
    <div className="webgl-fallback">
      <div className="fallback-card glass">
        <h1>🚀 Houston, we have a problem</h1>
        <p>Your browser or graphics hardware cannot display the 3D Solar System.</p>
        <p>Try updating your browser, enabling hardware acceleration, or using a device with WebGL support.</p>
        <div className="fallback-system" aria-label="2D solar system diagram">
          <span className="f-sun" title="Sun" />
          <span className="f-planet" style={{ ['--d' as string]: '60px', ['--c' as string]: '#9c8e84' }} title="Mercury" />
          <span className="f-planet" style={{ ['--d' as string]: '85px', ['--c' as string]: '#e8c37a' }} title="Venus" />
          <span className="f-planet" style={{ ['--d' as string]: '115px', ['--c' as string]: '#3f7fd4' }} title="Earth" />
          <span className="f-planet" style={{ ['--d' as string]: '140px', ['--c' as string]: '#c1613b' }} title="Mars" />
          <span className="f-planet" style={{ ['--d' as string]: '180px', ['--c' as string]: '#d8a06a' }} title="Jupiter" />
          <span className="f-planet" style={{ ['--d' as string]: '215px', ['--c' as string]: '#e0c68f' }} title="Saturn" />
          <span className="f-planet" style={{ ['--d' as string]: '245px', ['--c' as string]: '#9fd8dd' }} title="Uranus" />
          <span className="f-planet" style={{ ['--d' as string]: '270px', ['--c' as string]: '#3f66d4' }} title="Neptune" />
        </div>
      </div>
    </div>
  )
}
