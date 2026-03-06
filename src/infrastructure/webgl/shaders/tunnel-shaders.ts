export const TUNNEL_VERTEX_SHADER = `
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

export const TUNNEL_FRAGMENT_SHADER = `
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
    float lightBand = fract(scrollV * 6.6);
    float sodiumStrip = smoothstep(0.44, 0.50, lightBand) * (1.0 - smoothstep(0.50, 0.56, lightBand));

    vec3 inwardNormal = normalize(vNormal);

    vec3 baseColor = vec3(0.30, 0.30, 0.32);
    float stain = hash(vUv * 5.3) * 0.05 - 0.025;
    baseColor += stain;

    vec3 tileColor = mix(baseColor * 0.62, baseColor, tile);
    float sodiumFallR = smoothstep(0.07, 0.0, abs(vUv.x - 0.20));
    float sodiumFallL = smoothstep(0.07, 0.0, abs(vUv.x - 0.80));
    vec3 sodiumLight = vec3(1.0, 0.60, 0.06) * (sodiumFallR + sodiumFallL) * sodiumStrip * 3.0;
    vec3 sodiumAmbient = vec3(0.18, 0.09, 0.01) * 0.50;

    float rim = pow(max(0.0, 1.0 - abs(dot(inwardNormal, normalize(-vPosition)))), 2.2);
    vec3 rimColor = vec3(0.55, 0.35, 0.08) * rim * 0.12;

    vec3 finalColor = tileColor + sodiumLight + sodiumAmbient + rimColor;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`
