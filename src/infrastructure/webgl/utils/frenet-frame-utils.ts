import * as THREE from "three"

export function computeGroundedFrame(tangent: THREE.Vector3): {
  right: THREE.Vector3
  up: THREE.Vector3
} {
  const worldUp = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize()
  if (right.lengthSq() < 0.001) right.set(1, 0, 0)
  const up = new THREE.Vector3().crossVectors(tangent, right).normalize()
  return { right, up }
}
