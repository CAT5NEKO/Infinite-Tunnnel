import * as THREE from "three"
import { ROAD_VERTEX_SHADER, ROAD_FRAGMENT_SHADER } from "@/infrastructure/webgl/shaders/road-shaders"
import { computeGroundedFrame } from "@/infrastructure/webgl/utils/frenet-frame-utils"
import { ARCH_SEGMENTS, TUNNEL_RADIUS } from "@/infrastructure/webgl/tunnel-renderer-config"

export function buildRoadSurface(
  scene: THREE.Scene,
  tunnelCurve: THREE.CatmullRomCurve3,
  tangents: THREE.Vector3[]
): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial({
    vertexShader: ROAD_VERTEX_SHADER,
    fragmentShader: ROAD_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 1.0 } },
  })

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= ARCH_SEGMENTS; i++) {
    const point = tunnelCurve.getPoint(i / ARCH_SEGMENTS)
    const { right } = computeGroundedFrame(tangents[i]!)
    const v = i / ARCH_SEGMENTS
    positions.push(
      point.x - right.x * TUNNEL_RADIUS,
      point.y - right.y * TUNNEL_RADIUS,
      point.z - right.z * TUNNEL_RADIUS,
      point.x + right.x * TUNNEL_RADIUS,
      point.y + right.y * TUNNEL_RADIUS,
      point.z + right.z * TUNNEL_RADIUS
    )
    uvs.push(0, v, 1, v)
  }

  for (let i = 0; i < ARCH_SEGMENTS; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = (i + 1) * 2 + 1
    const d = (i + 1) * 2
    indices.push(a, b, c, a, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2))
  geo.setIndex(indices)
  scene.add(new THREE.Mesh(geo, material))

  return material
}
