import type { TunnelRendererDriver } from "@/infrastructure/webgl/tunnel-renderer-driver"
import type { CameraState, TunnelConfig, AnimationFrameState } from "@/shared/types/tunnel-types"
import { calculateCameraShake } from "@/domain/tunnel/camera-shake-calculator"
import { calculateSpeedEffectParams } from "@/domain/tunnel/speed-effect-calculator"

const SHAKE_POSITION_SCALE = 0.14
const SHAKE_ROTATION_SCALE = 0.45
const LOOP_DURATION_SECONDS = 30

export class TunnelSceneService {
  private readonly renderer: TunnelRendererDriver
  private readonly config: TunnelConfig

  constructor(renderer: TunnelRendererDriver, config: TunnelConfig) {
    this.renderer = renderer
    this.config = config
  }

  initializeWithCanvas(canvas: HTMLCanvasElement): void {
    this.renderer.initialize(canvas)
  }

  advanceFrame(frameState: AnimationFrameState): void {
    const loopedProgress = (frameState.elapsedSeconds % LOOP_DURATION_SECONDS) / LOOP_DURATION_SECONDS

    const baseCameraState: CameraState = {
      position: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
      fieldOfView: 82,
      rollAngle: 0,
    }

    const shakenCameraState = calculateCameraShake(baseCameraState, frameState.elapsedSeconds, {
      positionScale: SHAKE_POSITION_SCALE,
      rotationScale: SHAKE_ROTATION_SCALE,
    })

    const speedEffectParams = calculateSpeedEffectParams(this.config.speedKmh)

    this.renderer.renderFrame(shakenCameraState, speedEffectParams, loopedProgress)
  }

  resize(width: number, height: number): void {
    this.renderer.resize(width, height)
  }

  dispose(): void {
    this.renderer.dispose()
  }
}
