/**
 * A single-flight, latest-wins build queue.
 *
 * Rebuilding the surface maps is expensive and shares one cache, so two builds
 * must never run at once. But a request that arrives while a build is running
 * should not queue a whole second build behind it if an even newer request has
 * already replaced it — only the newest target matters. So `ensure` keeps at
 * most one build in flight and re-checks what is wanted after each pass: a
 * request that arrives mid-build supersedes the one in flight.
 *
 * Every caller gets a promise that settles when the queue goes idle — the maps
 * match the newest target, or the build failed — so a caller whose request was
 * superseded still learns when the dust settles instead of waiting forever.
 */
export interface BuildQueue<TTarget, TProgress> {
  /** Builds `target` unless it is already built, coalescing and superseding requests. */
  ensure(target: TTarget, onProgress: (progress: TProgress) => void): Promise<void>
  /** The target the queue most recently finished building, or null. */
  built(): TTarget | null
  /** Forgets everything, so the next `ensure` builds from scratch. */
  reset(): void
}

export function createBuildQueue<TTarget, TProgress>(
  run: (target: TTarget, onProgress: (progress: TProgress) => void) => Promise<void>,
): BuildQueue<TTarget, TProgress> {
  let builtTarget: TTarget | null = null
  let desired: TTarget | null = null
  let sink: ((progress: TProgress) => void) | null = null
  let building = false
  let waiting: Array<{ resolve: () => void; reject: (error: unknown) => void }> = []

  async function drain(): Promise<void> {
    if (building) return
    building = true
    let failure: unknown = null
    try {
      while (desired !== null && desired !== builtTarget) {
        const target = desired
        try {
          await run(target, (progress) => sink?.(progress))
          builtTarget = target
        } catch (error) {
          failure = error
          break
        }
      }
    } finally {
      building = false
      const pending = waiting
      waiting = []
      if (failure !== null) for (const waiter of pending) waiter.reject(failure)
      else for (const waiter of pending) waiter.resolve()
    }
  }

  return {
    ensure(target, onProgress) {
      desired = target
      sink = onProgress
      if (builtTarget === target && !building) return Promise.resolve()
      return new Promise<void>((resolve, reject) => {
        waiting.push({ resolve, reject })
        void drain()
      })
    },
    built: () => builtTarget,
    reset() {
      builtTarget = null
      desired = null
      sink = null
      building = false
      waiting = []
    },
  }
}
