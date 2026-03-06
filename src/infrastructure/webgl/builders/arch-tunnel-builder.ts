import * as THREE from "three"
import { TUNNEL_VERTEX_SHADER, TUNNEL_FRAGMENT_SHADER } from "@/infrastructure/webgl/shaders/tunnel-shaders"
import { computeGroundedFrame } from "@/infrastructure/webgl/utils/frenet-frame-utils"
import { ARCH_SEGMENTS, ARCH_RADIAL_DIVISIONS, TUNNEL_RADIUS, ARCH_HEIGHT } from "@/infrastructure/webgl/tunnel-renderer-config"

export function buildArchTunnel(
  scene: THREE.Scene,
  tunnelCurve: THREE.CatmullRomCurve3,
  tangents: THREE.Vector3[]
): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial({
    vertexShader: TUNNEL_VERTEX_SHADER,
    fragmentShader: TUNNEL_FRAGMENT_SHADER,
    side: THREE.BackSide,
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 1.0 } },
  })

  const vertsPerRing = ARCH_RADIAL_DIVISIONS + 1
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= ARCH_SEGMENTS; i++) {
    const point = tunnelCurve.getPoint(i / ARCH_SEGMENTS)
    const { right, up } = computeGroundedFrame(tangents[i]!)

    for (let j = 0; j <= ARCH_RADIAL_DIVISIONS; j++) {
      const theta = (j / ARCH_RADIAL_DIVISIONS) * Math.PI
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      positions.push(
        point.x + right.x * cosT * TUNNEL_RADIUS + up.x * sinT * ARCH_HEIGHT,
        point.y + right.y * cosT * TUNNEL_RADIUS + up.y * sinT * ARCH_HEIGHT,
        point.z + right.z * cosT * TUNNEL_RADIUS + up.z * sinT * ARCH_HEIGHT
      )
      normals.push(
        -right.x * cosT - up.x * sinT,
        -right.y * cosT - up.y * sinT,
        -right.z * cosT - up.z * sinT
      )
      uvs.push(j / ARCH_RADIAL_DIVISIONS, i / ARCH_SEGMENTS)
    }
  }

  for (let i = 0; i < ARCH_SEGMENTS; i++) {
    for (let j = 0; j < ARCH_RADIAL_DIVISIONS; j++) {
      const a = i * vertsPerRing + j
      const b = (i + 1) * vertsPerRing + j
      const c = (i + 1) * vertsPerRing + j + 1
      const d = i * vertsPerRing + j + 1
      indices.push(a, d, b, b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3))
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2))
  geo.setIndex(indices)
  scene.add(new THREE.Mesh(geo, material))

  return material
}
