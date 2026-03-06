import { useRef, useEffect } from "react"
import type { RefObject } from "react"
import { TunnelSceneService } from "@/application/tunnel-scene/tunnel-scene-service"
import { TunnelRenderer } from "@/infrastructure/webgl/tunnel-renderer"
import type { TunnelConfig } from "@/application/tunnel-scene/tunnel-scene-types"

export function useTunnelAnimation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  config: TunnelConfig
): void {
  const serviceRef = useRef<TunnelSceneService | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TunnelRenderer()
    const service = new TunnelSceneService(renderer, config)
    serviceRef.current = service
    service.initializeWithCanvas(canvas)

    const handleResize = () => service.resize(window.innerWidth, window.innerHeight)
    window.addEventListener("resize", handleResize)

    const runLoop = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsedSeconds = (timestamp - startTimeRef.current) / 1000
      service.advanceFrame({ elapsedSeconds, deltaSeconds: 0.016, progressRatio: 0 })
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
  // config は起動時に1度だけ読むため deps から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
