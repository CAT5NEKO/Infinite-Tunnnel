import type { CameraState, SpeedEffectParams } from "@/shared/types/tunnel-types"

export interface TunnelRendererDriver {
  initialize(canvas: HTMLCanvasElement): void
  renderFrame(cameraState: CameraState, speedEffectParams: SpeedEffectParams, progressRatio: number): void
  resize(width: number, height: number): void
  dispose(): void
}
