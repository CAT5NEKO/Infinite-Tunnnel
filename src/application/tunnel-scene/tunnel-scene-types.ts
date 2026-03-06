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
