export const ROAD_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const ROAD_FRAGMENT_SHADER = `
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

    float lightBand = fract(scrollV * 6.6);
    float reflection = smoothstep(0.44, 0.50, lightBand) * (1.0 - smoothstep(0.50, 0.56, lightBand));
    asphalt += vec3(0.22, 0.12, 0.02) * reflection * 0.80;

    gl_FragColor = vec4(asphalt, 1.0);
  }
`
