import * as THREE from "three"
import type { CameraState, SpeedEffectParams } from "@/shared/types/tunnel-types"
import type { TunnelRendererDriver } from "./tunnel-renderer-driver"

const TUNNEL_RADIUS = 5.8
const ARCH_HEIGHT = 8.5
const ARCH_SEGMENTS = 600
const ARCH_RADIAL_DIVISIONS = 24
const BASE_FOV = 82
const NEAR_PLANE = 0.1
const FAR_PLANE = 3000
const LIGHT_COUNT = 20
const AMBIENT_INTENSITY = 0.35
const DRIVER_HEIGHT_FROM_FLOOR = 1.35
const TUNNEL_CONTROL_POINTS = 22
const LOOP_RADIUS = 220

const TUNNEL_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalMatrix * normal;
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const TUNNEL_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float tilePattern(vec2 uv, float countX, float countY) {
    vec2 grid = fract(uv * vec2(countX, countY));
    vec2 edgeDist = min(grid, 1.0 - grid);
    return smoothstep(0.0, 0.025, min(edgeDist.x, edgeDist.y));
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float tile = tilePattern(vUv, 6.0, 70.0);

    float scrollV = vUv.y + uTime * uSpeed * 0.20;
    float lightFreq = 5.5;
    float lightBand = fract(scrollV * lightFreq);
    float lightStrip = smoothstep(0.44, 0.50, lightBand) * (1.0 - smoothstep(0.50, 0.56, lightBand));

    vec3 inwardNormal = normalize(vNormal);
    float topness = clamp(inwardNormal.y * 0.5 + 0.5, 0.0, 1.0);
    lightStrip *= (0.5 + topness * 0.5);

    vec3 baseColor = vec3(0.30, 0.30, 0.32);
    float stain = hash(vUv * 5.3) * 0.05 - 0.025;
    baseColor += stain;

    vec3 tileColor = mix(baseColor * 0.62, baseColor, tile);
    vec3 ledLight = vec3(0.88, 0.95, 1.0) * lightStrip * 2.6;
    vec3 ambientLed = vec3(0.06, 0.08, 0.13) * 0.4;

    float rim = pow(max(0.0, 1.0 - abs(dot(inwardNormal, normalize(-vPosition)))), 2.2);
    vec3 rimColor = vec3(0.4, 0.55, 0.8) * rim * 0.14;

    vec3 finalColor = tileColor + ledLight + ambientLed + rimColor;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const ROAD_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ROAD_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float roughness = hash(floor(vUv * vec2(180.0, 3000.0))) * 0.04;
    vec3 asphalt = vec3(0.11, 0.11, 0.10) + roughness;

    float scrollV = vUv.y + uTime * uSpeed * 0.20;
    float centerDist = abs(vUv.x - 0.5);
    float dashV = fract(scrollV * 28.0);
    float dashMask = step(dashV, 0.55);
    float centerLine = step(centerDist, 0.012) * dashMask;
    asphalt = mix(asphalt, vec3(0.88, 0.82, 0.22), centerLine * 0.85);

    float edgeLine = step(0.44, centerDist) * step(centerDist, 0.495);
    asphalt = mix(asphalt, vec3(0.82, 0.78, 0.72), edgeLine * 0.75);

    float lightBand = fract(scrollV * 5.5);
    float reflection = smoothstep(0.44, 0.50, lightBand) * (1.0 - smoothstep(0.50, 0.56, lightBand));
    asphalt += vec3(0.12, 0.09, 0.03) * reflection * 0.6;

    gl_FragColor = vec4(asphalt, 1.0);
  }
`

const POST_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const POST_FRAGMENT_SHADER = `
  uniform sampler2D uSceneTexture;
  uniform float uMotionBlur;
  uniform float uVignette;
  uniform float uTime;
  varying vec2 vUv;

  vec3 sampleMotionBlur(sampler2D tex, vec2 uv, float strength) {
    vec2 direction = uv - vec2(0.5);
    vec3 accumulated = vec3(0.0);
    const int SAMPLE_COUNT = 12;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
      float t = float(i) / float(SAMPLE_COUNT - 1);
      vec2 offset = direction * strength * t * 0.09;
      accumulated += texture2D(tex, uv - offset).rgb;
    }
    return accumulated / float(SAMPLE_COUNT);
  }

  float computeVignette(vec2 uv, float strength) {
    vec2 centered = uv - 0.5;
    return smoothstep(0.88, 0.22, length(centered) * (1.0 + strength * 0.55));
  }

  float filmGrain(vec2 uv, float time) {
    float n = fract(sin(dot(uv + time * 0.07, vec2(127.1, 311.7))) * 43758.5453);
    return (n - 0.5) * 0.035;
  }

  void main() {
    vec3 color = sampleMotionBlur(uSceneTexture, vUv, uMotionBlur);
    float vignetteMask = computeVignette(vUv, uVignette);
    color *= vignetteMask;

    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    float glow = max(0.0, brightness - 0.52) * 2.2;
    color += vec3(0.70, 0.88, 1.0) * glow * 0.35;

    color += filmGrain(vUv, uTime);
    color = pow(max(color, vec3(0.0)), vec3(0.9));

    gl_FragColor = vec4(color, 1.0);
  }
`

export class TunnelRenderer implements TunnelRendererDriver {
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
  private tunnelLights: THREE.Object3D | null = null
  private tunnelFrames: { tangents: THREE.Vector3[] } | null = null
  private elapsedSeconds = 0

  initialize(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.95

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x030508, 0.010)

    this.camera = new THREE.PerspectiveCamera(BASE_FOV, canvas.clientWidth / canvas.clientHeight, NEAR_PLANE, FAR_PLANE)

    this.tunnelCurve = new THREE.CatmullRomCurve3(this.buildLoopPoints(), true, "catmullrom", 0.4)
    const frenet = this.tunnelCurve.computeFrenetFrames(ARCH_SEGMENTS, true)
    this.tunnelFrames = { tangents: frenet.tangents }

    this.buildArchTunnel()
    this.buildRoadSurface()
    this.buildTunnelLights()
    this.buildPostProcessQuad(canvas.clientWidth, canvas.clientHeight)

    const ambientLight = new THREE.AmbientLight(0x1a0e04, AMBIENT_INTENSITY)
    this.scene.add(ambientLight)
  }

  private buildLoopPoints(): THREE.Vector3[] {
    return Array.from({ length: TUNNEL_CONTROL_POINTS }, (_, index) => {
      const angle = (index / TUNNEL_CONTROL_POINTS) * Math.PI * 2
      const r = LOOP_RADIUS + (Math.random() - 0.5) * 30
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 12
      const y = Math.sin(angle * 1.5) * 10 + (Math.random() - 0.5) * 5
      const z = Math.sin(angle) * r + (Math.random() - 0.5) * 12
      return new THREE.Vector3(x, y, z)
    })
  }

  private groundedFrame(tangent: THREE.Vector3): { right: THREE.Vector3; up: THREE.Vector3 } {
    const worldUp = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize()
    if (right.lengthSq() < 0.001) right.set(1, 0, 0)
    const up = new THREE.Vector3().crossVectors(tangent, right).normalize()
    return { right, up }
  }

  private buildArchTunnel(): void {
    if (!this.scene || !this.tunnelCurve || !this.tunnelFrames) return

    this.tunnelMaterial = new THREE.ShaderMaterial({
      vertexShader: TUNNEL_VERTEX_SHADER,
      fragmentShader: TUNNEL_FRAGMENT_SHADER,
      side: THREE.BackSide,
      uniforms: { uTime: { value: 0 }, uSpeed: { value: 1.0 } },
    })

    const { tangents: ft } = this.tunnelFrames
    const vertsPerRing = ARCH_RADIAL_DIVISIONS + 1
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let i = 0; i <= ARCH_SEGMENTS; i++) {
      const point = this.tunnelCurve.getPoint(i / ARCH_SEGMENTS)
      const { right, up } = this.groundedFrame(ft[i]!)
      for (let j = 0; j <= ARCH_RADIAL_DIVISIONS; j++) {
        const theta = (j / ARCH_RADIAL_DIVISIONS) * Math.PI
        const cosT = Math.cos(theta)
        const sinT = Math.sin(theta)
        positions.push(
          point.x + right.x * cosT * TUNNEL_RADIUS + up.x * sinT * ARCH_HEIGHT,
          point.y + right.y * cosT * TUNNEL_RADIUS + up.y * sinT * ARCH_HEIGHT,
          point.z + right.z * cosT * TUNNEL_RADIUS + up.z * sinT * ARCH_HEIGHT
        )
        normals.push(
          -right.x * cosT - up.x * sinT,
          -right.y * cosT - up.y * sinT,
          -right.z * cosT - up.z * sinT
        )
        uvs.push(j / ARCH_RADIAL_DIVISIONS, i / ARCH_SEGMENTS)
      }
    }

    for (let i = 0; i < ARCH_SEGMENTS; i++) {
      for (let j = 0; j < ARCH_RADIAL_DIVISIONS; j++) {
        const a = i * vertsPerRing + j
        const b = (i + 1) * vertsPerRing + j
        const c = (i + 1) * vertsPerRing + j + 1
        const d = i * vertsPerRing + j + 1
        indices.push(a, d, b, b, d, c)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3))
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2))
    geo.setIndex(indices)
    this.scene.add(new THREE.Mesh(geo, this.tunnelMaterial))
  }

  private buildRoadSurface(): void {
    if (!this.scene || !this.tunnelCurve || !this.tunnelFrames) return

    this.roadMaterial = new THREE.ShaderMaterial({
      vertexShader: ROAD_VERTEX_SHADER,
      fragmentShader: ROAD_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uSpeed: { value: 1.0 } },
    })

    const { tangents: ft } = this.tunnelFrames
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let i = 0; i <= ARCH_SEGMENTS; i++) {
      const point = this.tunnelCurve.getPoint(i / ARCH_SEGMENTS)
      const { right } = this.groundedFrame(ft[i]!)
      const v = i / ARCH_SEGMENTS
      positions.push(
        point.x - right.x * TUNNEL_RADIUS,
        point.y - right.y * TUNNEL_RADIUS,
        point.z - right.z * TUNNEL_RADIUS,
        point.x + right.x * TUNNEL_RADIUS,
        point.y + right.y * TUNNEL_RADIUS,
        point.z + right.z * TUNNEL_RADIUS
      )
      uvs.push(0, v, 1, v)
    }

    for (let i = 0; i < ARCH_SEGMENTS; i++) {
      const a = i * 2
      const b = i * 2 + 1
      const c = (i + 1) * 2 + 1
      const d = (i + 1) * 2
      indices.push(a, b, c, a, c, d)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2))
    geo.setIndex(indices)
    this.scene.add(new THREE.Mesh(geo, this.roadMaterial))
  }

  private buildTunnelLights(): void {
    if (!this.scene || !this.tunnelCurve || !this.tunnelFrames) return

    const { tangents: ft } = this.tunnelFrames
    const stripPositions: number[] = []
    const stripColors: number[] = []
    const STRIP_HALF = 0.55
    const CROWN_SCALE = 0.86

    for (let index = 0; index < LIGHT_COUNT; index++) {
      const t = index / LIGHT_COUNT
      const frameIdx = Math.min(Math.round(t * ARCH_SEGMENTS), ARCH_SEGMENTS)
      const point = this.tunnelCurve.getPoint(t)
      const tang = ft[frameIdx]!
      const { up } = this.groundedFrame(tang)
      const cx = point.x + up.x * ARCH_HEIGHT * CROWN_SCALE
      const cy = point.y + up.y * ARCH_HEIGHT * CROWN_SCALE
      const cz = point.z + up.z * ARCH_HEIGHT * CROWN_SCALE
      stripPositions.push(
        cx - tang.x * STRIP_HALF, cy - tang.y * STRIP_HALF, cz - tang.z * STRIP_HALF,
        cx + tang.x * STRIP_HALF, cy + tang.y * STRIP_HALF, cz + tang.z * STRIP_HALF
      )
      const brightness = 0.82 + Math.random() * 0.18
      stripColors.push(
        0.88 * brightness, 0.95 * brightness, 1.0 * brightness,
        0.88 * brightness, 0.95 * brightness, 1.0 * brightness
      )
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(stripPositions), 3))
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(stripColors), 3))
    this.tunnelLights = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }))
    this.scene.add(this.tunnelLights)
  }

  private buildPostProcessQuad(width: number, height: number): void {
    this.postScene = new THREE.Scene()
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.renderTarget = new THREE.WebGLRenderTarget(width, height)

    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: POST_VERTEX_SHADER,
      fragmentShader: POST_FRAGMENT_SHADER,
      uniforms: {
        uSceneTexture: { value: this.renderTarget.texture },
        uMotionBlur: { value: 0.5 },
        uVignette: { value: 0.7 },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial))
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
    const { up } = this.groundedFrame(tang)

    const driverOffset = DRIVER_HEIGHT_FROM_FLOOR

    this.camera.position.set(
      pathPoint.x + up.x * driverOffset + cameraState.position.x,
      pathPoint.y + up.y * driverOffset + cameraState.position.y,
      pathPoint.z + up.z * driverOffset + cameraState.position.z
    )
    this.camera.lookAt(
      lookAheadPoint.x + up.x * driverOffset + cameraState.lookAt.x,
      lookAheadPoint.y + up.y * driverOffset + cameraState.lookAt.y,
      lookAheadPoint.z + up.z * driverOffset + cameraState.lookAt.z
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
    this.tunnelLights = null
    this.tunnelFrames = null
  }
}
