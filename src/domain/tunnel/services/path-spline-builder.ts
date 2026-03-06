import type { Vector3D } from "@/domain/tunnel/tunnel-value-types"

const SPREAD_XY = 60
const SPREAD_Z = 120
const TUNNEL_FORWARD_BIAS = 180

function generateRandomControlPoints(count: number): Vector3D[] {
  return Array.from({ length: count }, (_, index) => ({
    x: (Math.random() - 0.5) * SPREAD_XY,
    y: (Math.random() - 0.5) * SPREAD_XY,
    z: -index * TUNNEL_FORWARD_BIAS + (Math.random() - 0.5) * SPREAD_Z,
  }))
}

function lerpVector3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }
}

function catmullRomPoint(
  p0: Vector3D,
  p1: Vector3D,
  p2: Vector3D,
  p3: Vector3D,
  t: number
): Vector3D {
  const t2 = t * t
  const t3 = t2 * t
  const calculate = (a: number, b: number, c: number, d: number): number =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)

  return {
    x: calculate(p0.x, p1.x, p2.x, p3.x),
    y: calculate(p0.y, p1.y, p2.y, p3.y),
    z: calculate(p0.z, p1.z, p2.z, p3.z),
  }
}

export function sampleSplinePath(controlPoints: Vector3D[], sampleCount: number): Vector3D[] {
  const points: Vector3D[] = []
  const segmentCount = controlPoints.length - 1

  for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex++) {
    const globalT = (sampleIndex / sampleCount) * segmentCount
    const segmentIndex = Math.min(Math.floor(globalT), segmentCount - 1)
    const localT = globalT - segmentIndex

    const p0 = controlPoints[Math.max(0, segmentIndex - 1)]!
    const p1 = controlPoints[segmentIndex]!
    const p2 = controlPoints[Math.min(controlPoints.length - 1, segmentIndex + 1)]!
    const p3 = controlPoints[Math.min(controlPoints.length - 1, segmentIndex + 2)]!

    points.push(catmullRomPoint(p0, p1, p2, p3, localT))
  }

  return points
}

export function buildSplinePath(segmentCount: number): Vector3D[] {
  const controlPoints = generateRandomControlPoints(Math.ceil(segmentCount / 8) + 2)
  return sampleSplinePath(controlPoints, segmentCount)
}

export function interpolatePathPosition(path: Vector3D[], progressRatio: number): Vector3D {
  const clampedRatio = Math.max(0, Math.min(1, progressRatio))
  const floatIndex = clampedRatio * (path.length - 1)
  const lowerIndex = Math.floor(floatIndex)
  const upperIndex = Math.min(path.length - 1, lowerIndex + 1)
  const localT = floatIndex - lowerIndex

  return lerpVector3D(path[lowerIndex]!, path[upperIndex]!, localT)
}
