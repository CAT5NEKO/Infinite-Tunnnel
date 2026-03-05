import type { CameraState, ShakeIntensity, Vector3D } from "@/shared/types/tunnel-types"

const SHAKE_FREQUENCY_FAST = 1.7
const SHAKE_FREQUENCY_SLOW = 0.4
const SHAKE_FREQUENCY_MID = 0.9
const ROLL_FREQUENCY = 0.25

function smoothNoise(seed: number, time: number, frequency: number): number {
  const phase = seed * 31.7 + time * frequency
  return Math.sin(phase) * 0.6 + Math.sin(phase * 2.3 + 1.1) * 0.3 + Math.sin(phase * 5.1 + 2.4) * 0.1
}

function calculateShakeOffset(elapsedSeconds: number, axisSeeds: [number, number, number], shakeIntensity: ShakeIntensity): Vector3D {
  return {
    x: (
      smoothNoise(axisSeeds[0], elapsedSeconds, SHAKE_FREQUENCY_SLOW) * 0.5 +
      smoothNoise(axisSeeds[0] + 10, elapsedSeconds, SHAKE_FREQUENCY_FAST) * 0.3 +
      smoothNoise(axisSeeds[0] + 20, elapsedSeconds, SHAKE_FREQUENCY_MID) * 0.2
    ) * shakeIntensity.positionScale,
    y: (
      smoothNoise(axisSeeds[1], elapsedSeconds, SHAKE_FREQUENCY_SLOW) * 0.5 +
      smoothNoise(axisSeeds[1] + 10, elapsedSeconds, SHAKE_FREQUENCY_FAST) * 0.3 +
      smoothNoise(axisSeeds[1] + 20, elapsedSeconds, SHAKE_FREQUENCY_MID) * 0.2
    ) * shakeIntensity.positionScale,
    z: (
      smoothNoise(axisSeeds[2], elapsedSeconds, SHAKE_FREQUENCY_FAST) * 0.7 +
      smoothNoise(axisSeeds[2] + 10, elapsedSeconds, SHAKE_FREQUENCY_MID) * 0.3
    ) * shakeIntensity.positionScale * 0.3,
  }
}

export function calculateCameraShake(
  baseCameraState: CameraState,
  elapsedSeconds: number,
  shakeIntensity: ShakeIntensity
): CameraState {
  const positionOffset = calculateShakeOffset(elapsedSeconds, [1.0, 2.0, 3.0], shakeIntensity)
  const lookAtOffset = calculateShakeOffset(elapsedSeconds, [4.0, 5.0, 6.0], {
    positionScale: shakeIntensity.rotationScale,
    rotationScale: shakeIntensity.rotationScale,
  })

  const rollAngleDelta = smoothNoise(7.0, elapsedSeconds, ROLL_FREQUENCY) * shakeIntensity.rotationScale * 0.04

  return {
    position: {
      x: baseCameraState.position.x + positionOffset.x,
      y: baseCameraState.position.y + positionOffset.y,
      z: baseCameraState.position.z + positionOffset.z,
    },
    lookAt: {
      x: baseCameraState.lookAt.x + lookAtOffset.x,
      y: baseCameraState.lookAt.y + lookAtOffset.y,
      z: baseCameraState.lookAt.z + lookAtOffset.z,
    },
    fieldOfView: baseCameraState.fieldOfView,
    rollAngle: baseCameraState.rollAngle + rollAngleDelta,
  }
}
