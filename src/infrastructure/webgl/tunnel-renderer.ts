import * as THREE from "three"
import type { CameraState, SpeedEffectParams } from "@/domain/tunnel/tunnel-value-types"
import type { TunnelRendererPort } from "@/domain/tunnel/ports/tunnel-renderer-port"
import { buildArchTunnel } from "@/infrastructure/webgl/builders/arch-tunnel-builder"
import { buildRoadSurface } from "@/infrastructure/webgl/builders/road-surface-builder"
import { buildTunnelLights } from "@/infrastructure/webgl/builders/tunnel-lights-builder"
import { buildPostProcessQuad } from "@/infrastructure/webgl/builders/post-process-builder"
import { buildLoopPoints } from "@/infrastructure/webgl/utils/loop-path-factory"
import { computeGroundedFrame } from "@/infrastructure/webgl/utils/frenet-frame-utils"
import {
  BASE_FOV, NEAR_PLANE, FAR_PLANE,
  ARCH_SEGMENTS, DRIVER_HEIGHT_FROM_FLOOR, AMBIENT_INTENSITY,
} from "@/infrastructure/webgl/tunnel-renderer-config"

export class TunnelRenderer implements TunnelRendererPort {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private tunnelCurve: THREE.CatmullRomCurve3 | null = null
  private renderTarget: THREE.WebGLRenderTarget | null = null
  private postScene: THREE.Scene | null = null
  private postCamera: THREE.OrthographicCamera | null = null
  private postMaterial: THREE.ShaderMaterial | null = null
  private tunnelMaterial: THREE.ShaderMaterial | null = null
  private roadMaterial: THREE.ShaderMaterial | null = null
  private tunnelFrames: { tangents: THREE.Vector3[] } | null = null
  private elapsedSeconds = 0

  initialize(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.72

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x040200, 0.010)

    this.camera = new THREE.PerspectiveCamera(BASE_FOV, canvas.clientWidth / canvas.clientHeight, NEAR_PLANE, FAR_PLANE)

    this.tunnelCurve = new THREE.CatmullRomCurve3(buildLoopPoints(), true, "catmullrom", 0.4)
    const frenet = this.tunnelCurve.computeFrenetFrames(ARCH_SEGMENTS, true)
    this.tunnelFrames = { tangents: frenet.tangents }

    this.tunnelMaterial = buildArchTunnel(this.scene, this.tunnelCurve, this.tunnelFrames.tangents)
    this.roadMaterial = buildRoadSurface(this.scene, this.tunnelCurve, this.tunnelFrames.tangents)
    buildTunnelLights(this.scene, this.tunnelCurve, this.tunnelFrames.tangents)

    const post = buildPostProcessQuad(canvas.clientWidth, canvas.clientHeight)
    this.postScene = post.scene
    this.postCamera = post.camera
    this.renderTarget = post.renderTarget
    this.postMaterial = post.material

    this.scene.add(new THREE.AmbientLight(0x110902, AMBIENT_INTENSITY))
  }

  renderFrame(cameraState: CameraState, speedEffectParams: SpeedEffectParams, progressRatio: number): void {
    if (!this.renderer || !this.scene || !this.camera || !this.tunnelCurve || !this.renderTarget) return

    this.elapsedSeconds += 0.016

    const t = progressRatio % 1.0
    const tAhead = (t + 0.004) % 1.0
    const pathPoint = this.tunnelCurve.getPoint(t)
    const lookAheadPoint = this.tunnelCurve.getPoint(tAhead)

    const frameIdx = Math.min(Math.round(t * ARCH_SEGMENTS), ARCH_SEGMENTS)
    const tang = this.tunnelFrames?.tangents[frameIdx] ?? new THREE.Vector3(0, 0, -1)
    const { up } = computeGroundedFrame(tang)

    this.camera.position.set(
      pathPoint.x + up.x * DRIVER_HEIGHT_FROM_FLOOR + cameraState.position.x,
      pathPoint.y + up.y * DRIVER_HEIGHT_FROM_FLOOR + cameraState.position.y,
      pathPoint.z + up.z * DRIVER_HEIGHT_FROM_FLOOR + cameraState.position.z
    )
    this.camera.lookAt(
      lookAheadPoint.x + up.x * DRIVER_HEIGHT_FROM_FLOOR + cameraState.lookAt.x,
      lookAheadPoint.y + up.y * DRIVER_HEIGHT_FROM_FLOOR + cameraState.lookAt.y,
      lookAheadPoint.z + up.z * DRIVER_HEIGHT_FROM_FLOOR + cameraState.lookAt.z
    )
    this.camera.rotation.z += cameraState.rollAngle
    this.camera.fov = BASE_FOV + speedEffectParams.fieldOfViewDelta
    this.camera.updateProjectionMatrix()

    const speedUni = speedEffectParams.motionBlurStrength + 0.3

    if (this.tunnelMaterial) {
      this.tunnelMaterial.uniforms["uTime"]!.value = this.elapsedSeconds
      this.tunnelMaterial.uniforms["uSpeed"]!.value = speedUni
    }
    if (this.roadMaterial) {
      this.roadMaterial.uniforms["uTime"]!.value = this.elapsedSeconds
      this.roadMaterial.uniforms["uSpeed"]!.value = speedUni
    }
    if (this.postMaterial) {
      this.postMaterial.uniforms["uMotionBlur"]!.value = speedEffectParams.motionBlurStrength
      this.postMaterial.uniforms["uVignette"]!.value = speedEffectParams.vignetteStrength
      this.postMaterial.uniforms["uTime"]!.value = this.elapsedSeconds
    }

    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
    if (this.postScene && this.postCamera) {
      this.renderer.render(this.postScene, this.postCamera)
    }
  }

  resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || !this.renderTarget) return
    this.renderer.setSize(width, height)
    this.renderTarget.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  dispose(): void {
    this.renderer?.dispose()
    this.renderTarget?.dispose()
    this.tunnelMaterial?.dispose()
    this.roadMaterial?.dispose()
    this.postMaterial?.dispose()
    this.renderer = null
    this.scene = null
    this.camera = null
    this.tunnelCurve = null
    this.renderTarget = null
    this.postScene = null
    this.postCamera = null
    this.postMaterial = null
    this.tunnelMaterial = null
    this.roadMaterial = null
    this.tunnelFrames = null
  }
}
