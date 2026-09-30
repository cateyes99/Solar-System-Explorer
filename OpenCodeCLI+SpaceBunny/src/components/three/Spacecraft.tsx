import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  MeshStandardMaterial,
  Vector3,
} from 'three'
import { bodyPosition, bodyRadius } from '../../store/registry'
import { SHIP_MANUAL_CODES } from '../../store/shipKeys'
import { useAppStore } from '../../store/useAppStore'
import { isFlightKeyDown as isDown, useShipKeys } from '../../hooks/useShipKeys'
import { clamp } from '../../utils/math'
import { resolveBodyName } from '../../utils/astronomy'
import { orbitRadiusUnits } from '../../utils/scale'
import type { ScaleSettings } from '../../types'

const MAX_SPEED = 30

/**
 * A procedurally modelled spacecraft. The child can fly it manually or hand it
 * to the autopilot, which steers toward the chosen destination and brakes on
 * approach.
 */
export function Spacecraft({ scale: scaleSettings }: { scale: ScaleSettings }) {
  const active = useAppStore((s) => s.shipActive)
  const autopilot = useAppStore((s) => s.shipAutopilot)
  const targetId = useAppStore((s) => s.shipTarget)
  const setShipTelemetry = useAppStore((s) => s.setShipTelemetry)

  const groupRef = useRef<Group>(null)
  const position = useRef(new Vector3(7, 1, 8))
  const velocity = useRef(new Vector3())
  const heading = useRef(new Vector3(0, 0, -1))
  const arrived = useRef(false)
  const telemetryClock = useRef(0)
  const manualPresses = useRef(0)

  useShipKeys(active)

  const geometry = useMemo(
    () => ({
      hull: new ConeGeometry(0.34, 1.2, 16),
      body: new CylinderGeometry(0.24, 0.3, 0.72, 16),
      panel: new BoxGeometry(0.06, 0.02, 1.6),
      wing: new BoxGeometry(0.92, 0.04, 0.44),
      flame: new ConeGeometry(0.17, 0.75, 10),
    }),
    [],
  )

  const material = useMemo(() => new MeshStandardMaterial({ color: '#dde8f6', roughness: 0.35, metalness: 0.65 }), [])
  const darkMaterial = useMemo(() => new MeshStandardMaterial({ color: '#1b2c46', roughness: 0.5, metalness: 0.7 }), [])
  const solarMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#1d3f8a', roughness: 0.25, metalness: 0.5, emissive: new Color('#0a1c46') }),
    [],
  )
  const flameMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#8fd4ff',
        emissive: new Color('#66b4ff'),
        emissiveIntensity: 1.6,
        transparent: true,
        opacity: 0.8,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useEffect(
    () => () => {
      Object.values(geometry).forEach((g) => g.dispose())
      material.dispose()
      darkMaterial.dispose()
      solarMaterial.dispose()
      flameMaterial.dispose()
    },
    [geometry, material, darkMaterial, solarMaterial, flameMaterial],
  )

  const worldTarget = useMemo(() => new Vector3(), [])
  const desired = useMemo(() => new Vector3(), [])
  const lookPoint = useMemo(() => new Vector3(), [])
  const upAxis = useMemo(() => new Vector3(0, 1, 0), [])
  const unitsPerAu = Math.max(0.0001, orbitRadiusUnits(1, scaleSettings.distanceExponent))

  useFrame((_, rawDelta) => {
    const group = groupRef.current
    if (!group || !active) return
    const delta = Math.min(rawDelta, 0.05)

    const boost = isDown('ShiftLeft') || isDown('ShiftRight') ? 2.6 : 1
    const accel = 11 * boost

    /* ---- manual flight ---- */
    if (isDown('KeyW') || isDown('ArrowUp')) velocity.current.addScaledVector(heading.current, accel * delta)
    if (isDown('KeyS') || isDown('ArrowDown')) velocity.current.addScaledVector(heading.current, -accel * delta)
    if (isDown('KeyA') || isDown('ArrowLeft')) heading.current.applyAxisAngle(upAxis, 1.6 * delta)
    if (isDown('KeyD') || isDown('ArrowRight')) heading.current.applyAxisAngle(upAxis, -1.6 * delta)
    if (isDown('KeyQ')) velocity.current.y -= accel * delta
    if (isDown('KeyE')) velocity.current.y += accel * delta

    if (SHIP_MANUAL_CODES.some(isDown)) {
      manualPresses.current += 1
      if (autopilot && manualPresses.current > 4) useAppStore.getState().setShipAutopilot(false)
    }

    /* ---- autopilot ---- */
    if (autopilot && targetId) {
      worldTarget.copy(bodyPosition(targetId))
      desired.copy(worldTarget).sub(position.current)
      const distance = desired.length()
      const stopAt = Math.max(bodyRadius(targetId) * 3.4, 1.4)

      if (distance < stopAt) {
        arrived.current = true
        velocity.current.multiplyScalar(Math.max(0, 1 - delta * 4))
      } else {
        arrived.current = false
        desired.divideScalar(distance)
        heading.current.lerp(desired, clamp(delta * 1.7, 0, 1)).normalize()
        const speedGoal = clamp(distance * 0.6, 1.4, MAX_SPEED)
        if (velocity.current.length() < speedGoal) {
          velocity.current.addScaledVector(heading.current, accel * delta)
        }
        // Cancel sideways drift so the approach curves back onto the target.
        const along = desired.dot(heading.current)
        velocity.current.addScaledVector(desired, -along * delta * 2.4)
      }
    }

    /* ---- integrate ---- */
    velocity.current.multiplyScalar(1 - clamp(delta * 0.4, 0, 1))
    if (velocity.current.length() > MAX_SPEED) velocity.current.setLength(MAX_SPEED)
    position.current.addScaledVector(velocity.current, delta)

    group.position.copy(position.current)
    lookPoint.copy(position.current).add(heading.current)
    group.lookAt(lookPoint)

    /* ---- telemetry at 5 Hz ---- */
    telemetryClock.current += delta
    if (telemetryClock.current > 0.2) {
      telemetryClock.current = 0
      setShipTelemetry({
        speedUnitsPerSecond: velocity.current.length(),
        distanceAu: position.current.length() / unitsPerAu,
        targetName: autopilot && targetId ? resolveBodyName(targetId) : 'Free flight',
        arrivalProgress:
          autopilot && targetId
            ? clamp(1 - bodyPosition(targetId).distanceTo(position.current) / 120, 0, 1)
            : 0,
        arrived: arrived.current,
      })
    }
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry.hull} material={material} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.58]} />
      <mesh geometry={geometry.body} material={darkMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.16]} />
      <mesh geometry={geometry.wing} material={darkMaterial} position={[0, 0, -0.12]} />
      <mesh geometry={geometry.panel} material={solarMaterial} position={[0.8, 0, -0.12]} />
      <mesh geometry={geometry.panel} material={solarMaterial} position={[-0.8, 0, -0.12]} />
      <mesh geometry={geometry.flame} material={flameMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.9]} />
      <pointLight intensity={1.4} distance={7} decay={2} color="#7fc4ff" />
    </group>
  )
}