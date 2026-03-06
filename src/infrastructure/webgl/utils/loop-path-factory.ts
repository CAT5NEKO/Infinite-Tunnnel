import * as THREE from "three"
import { TUNNEL_CONTROL_POINTS, LOOP_RADIUS } from "@/infrastructure/webgl/tunnel-renderer-config"

export function buildLoopPoints(): THREE.Vector3[] {
  return Array.from({ length: TUNNEL_CONTROL_POINTS }, (_, index) => {
    const angle = (index / TUNNEL_CONTROL_POINTS) * Math.PI * 2
    const r = LOOP_RADIUS + (Math.random() - 0.5) * 30
    const x = Math.cos(angle) * r + (Math.random() - 0.5) * 12
    const y = Math.sin(angle * 1.5) * 10 + (Math.random() - 0.5) * 5
    const z = Math.sin(angle) * r + (Math.random() - 0.5) * 12
    return new THREE.Vector3(x, y, z)
  })
}
