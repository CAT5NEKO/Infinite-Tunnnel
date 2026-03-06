import type { CameraState, SpeedEffectParams } from "@/domain/tunnel/tunnel-value-types"

export interface TunnelRendererPort {
  initialize(canvas: HTMLCanvasElement): void
  renderFrame(cameraState: CameraState, speedEffectParams: SpeedEffectParams, progressRatio: number): void
  resize(width: number, height: number): void
  dispose(): void
}
