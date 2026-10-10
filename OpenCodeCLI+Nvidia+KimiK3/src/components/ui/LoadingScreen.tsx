export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Loading the Solar System">
      <div className="mini-system" aria-hidden>
        <div className="mini-sun" />
        <div className="mini-orbit o1"><span /></div>
        <div className="mini-orbit o2"><span /></div>
        <div className="mini-orbit o3"><span /></div>
      </div>
      <h1>Preparing the Solar System...</h1>
      <p>Igniting the Sun, lining up the planets, counting the stars ✨</p>
    </div>
  )
}
