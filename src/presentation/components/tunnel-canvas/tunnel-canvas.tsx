import { useRef } from "react"
import { useTunnelAnimation } from "@/presentation/hooks/use-tunnel-animation"

const TUNNEL_CONFIG = {
  speedKmh: 500,
  tunnelRadius: 8,
  segmentCount: 512,
  pathLengthMeters: 2400,
}

export function TunnelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useTunnelAnimation(canvasRef, TUNNEL_CONFIG)

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen block"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  )
}
