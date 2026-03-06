import type { SpeedEffectParams } from "@/domain/tunnel/tunnel-value-types"

const BASE_MOTION_BLUR = 0.65
const BASE_FOV_DELTA = 14
const BASE_VIGNETTE = 0.72
const SPEED_REFERENCE_KMH = 500

export function calculateSpeedEffectParams(speedKmh: number): SpeedEffectParams {
  const speedRatio = Math.min(speedKmh / SPEED_REFERENCE_KMH, 1.5)
  const easedRatio = 1 - Math.pow(1 - speedRatio, 2)

  return {
    motionBlurStrength: BASE_MOTION_BLUR * easedRatio,
    fieldOfViewDelta: BASE_FOV_DELTA * easedRatio,
    vignetteStrength: BASE_VIGNETTE * (0.6 + 0.4 * easedRatio),
  }
}
