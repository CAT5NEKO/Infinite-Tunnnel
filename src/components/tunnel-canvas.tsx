import { useRef, useEffect } from "react"
import { TunnelSceneService } from "@/application/tunnel-scene-service"
import { TunnelRenderer } from "@/infrastructure/webgl/tunnel-renderer"

const TUNNEL_CONFIG = {
  speedKmh: 500,
  tunnelRadius: 8,
  segmentCount: 512,
  pathLengthMeters: 2400,
}

export function TunnelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const serviceRef = useRef<TunnelSceneService | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TunnelRenderer()
    const service = new TunnelSceneService(renderer, TUNNEL_CONFIG)
    serviceRef.current = service

    service.initializeWithCanvas(canvas)

    const handleResize = () => {
      service.resize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    const runLoop = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsedSeconds = (timestamp - startTimeRef.current) / 1000

      service.advanceFrame({
        elapsedSeconds,
        deltaSeconds: 0.016,
        progressRatio: 0,
      })

      animationIdRef.current = requestAnimationFrame(runLoop)
    }

    animationIdRef.current = requestAnimationFrame(runLoop)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current)
      service.dispose()
      serviceRef.current = null
      startTimeRef.current = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen block"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  )
}
