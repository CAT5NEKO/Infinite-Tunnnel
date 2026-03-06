import * as THREE from "three"
import { POST_VERTEX_SHADER, POST_FRAGMENT_SHADER } from "@/infrastructure/webgl/shaders/post-process-shaders"

export type PostProcessBundle = {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderTarget: THREE.WebGLRenderTarget
  material: THREE.ShaderMaterial
}

export function buildPostProcessQuad(width: number, height: number): PostProcessBundle {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const renderTarget = new THREE.WebGLRenderTarget(width, height)

  const material = new THREE.ShaderMaterial({
    vertexShader: POST_VERTEX_SHADER,
    fragmentShader: POST_FRAGMENT_SHADER,
    uniforms: {
      uSceneTexture: { value: renderTarget.texture },
      uMotionBlur: { value: 0.5 },
      uVignette: { value: 0.7 },
      uTime: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  })

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

  return { scene, camera, renderTarget, material }
}
