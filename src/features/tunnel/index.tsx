import { useRef } from "react";
import { useTunnelAnimation } from "./hooks";
import { TUNNEL_CONFIG } from "./constants";

export function TunnelSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useTunnelAnimation(canvasRef, TUNNEL_CONFIG);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen block"
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}
