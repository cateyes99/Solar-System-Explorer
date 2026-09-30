import type { SceneTextures } from './textures'

let current: SceneTextures | null = null

/** Textures are generated once during boot and read by the scene on demand. */
export function setSceneTextures(textures: SceneTextures): void {
  current = textures
}

export function getSceneTextures(): SceneTextures {
  if (!current) throw new Error('Scene textures have not been generated yet')
  return current
}
