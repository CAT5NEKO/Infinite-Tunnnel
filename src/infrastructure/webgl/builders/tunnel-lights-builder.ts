import * as THREE from "three"
import { computeGroundedFrame } from "@/infrastructure/webgl/utils/frenet-frame-utils"
import { ARCH_SEGMENTS, TUNNEL_RADIUS, ARCH_HEIGHT, LIGHT_COUNT } from "@/infrastructure/webgl/tunnel-renderer-config"

const STRIP_HALF = 0.55
const THETA_RIGHT = Math.PI / 5
const THETA_LEFT = (4 * Math.PI) / 5
const SODIUM_SCALE = 0.90

export function buildTunnelLights(
  scene: THREE.Scene,
  tunnelCurve: THREE.CatmullRomCurve3,
  tangents: THREE.Vector3[]
): void {
  const sodiumPositions: number[] = []
  const sodiumColors: number[] = []

  for (let index = 0; index < LIGHT_COUNT; index++) {
    const t = index / LIGHT_COUNT
    const frameIdx = Math.min(Math.round(t * ARCH_SEGMENTS), ARCH_SEGMENTS)
    const point = tunnelCurve.getPoint(t)
    const tang = tangents[frameIdx]!
    const { right, up } = computeGroundedFrame(tang)

    for (const theta of [THETA_RIGHT, THETA_LEFT]) {
      const cr = Math.cos(theta) * TUNNEL_RADIUS * SODIUM_SCALE
      const cu = Math.sin(theta) * ARCH_HEIGHT * SODIUM_SCALE
      const cx = point.x + right.x * cr + up.x * cu
      const cy = point.y + right.y * cr + up.y * cu
      const cz = point.z + right.z * cr + up.z * cu
      sodiumPositions.push(
        cx - tang.x * STRIP_HALF, cy - tang.y * STRIP_HALF, cz - tang.z * STRIP_HALF,
        cx + tang.x * STRIP_HALF, cy + tang.y * STRIP_HALF, cz + tang.z * STRIP_HALF
      )
      const b = 0.85 + Math.random() * 0.15
      sodiumColors.push(1.0 * b, 0.60 * b, 0.06 * b, 1.0 * b, 0.60 * b, 0.06 * b)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sodiumPositions), 3))
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(sodiumColors), 3))
  scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })))
}
