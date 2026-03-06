import type { TunnelRendererPort } from "@/domain/tunnel/ports/tunnel-renderer-port"
import type { CameraState } from "@/domain/tunnel/tunnel-value-types"
import type { TunnelConfig, AnimationFrameState } from "@/application/tunnel-scene/tunnel-scene-types"
import { calculateCameraShake } from "@/domain/tunnel/services/camera-shake-calculator"
import { calculateSpeedEffectParams } from "@/domain/tunnel/services/speed-effect-calculator"

const SHAKE_POSITION_SCALE = 0.14
const SHAKE_ROTATION_SCALE = 0.45
const LOOP_DURATION_SECONDS = 30

const BASE_CAMERA_STATE: CameraState = {
  position: { x: 0, y: 0, z: 0 },
  lookAt: { x: 0, y: 0, z: 0 },
  fieldOfView: 82,
  rollAngle: 0,
}

export class TunnelSceneService {
  private readonly renderer: TunnelRendererPort
  private readonly config: TunnelConfig

  constructor(renderer: TunnelRendererPort, config: TunnelConfig) {
    this.renderer = renderer
    this.config = config
  }

  initializeWithCanvas(canvas: HTMLCanvasElement): void {
    this.renderer.initialize(canvas)
  }

  advanceFrame(frameState: AnimationFrameState): void {
    const loopedProgress = (frameState.elapsedSeconds % LOOP_DURATION_SECONDS) / LOOP_DURATION_SECONDS

    const shakenCameraState = calculateCameraShake(BASE_CAMERA_STATE, frameState.elapsedSeconds, {
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
