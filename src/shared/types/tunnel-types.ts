export type Vector3D = {
  x: number
  y: number
  z: number
}

export type CameraState = {
  position: Vector3D
  lookAt: Vector3D
  fieldOfView: number
  rollAngle: number
}

export type TunnelConfig = {
  speedKmh: number
  tunnelRadius: number
  segmentCount: number
  pathLengthMeters: number
}

export type AnimationFrameState = {
  elapsedSeconds: number
  deltaSeconds: number
  progressRatio: number
}

export type ShakeIntensity = {
  positionScale: number
  rotationScale: number
}

export type SpeedEffectParams = {
  motionBlurStrength: number
  fieldOfViewDelta: number
  vignetteStrength: number
}
