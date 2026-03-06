export const POST_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const POST_FRAGMENT_SHADER = `
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
