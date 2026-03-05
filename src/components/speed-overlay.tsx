const SPEED_KMH = 500

export function SpeedOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 font-mono">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-cyan-400/60 uppercase tracking-[0.3em]">velocity</span>
          <div className="flex items-end gap-1">
            <span className="text-5xl font-black text-white tabular-nums leading-none"
              style={{ textShadow: "0 0 20px rgba(100,200,255,0.8), 0 0 60px rgba(50,150,255,0.4)" }}>
              {SPEED_KMH}
            </span>
            <span className="text-cyan-400 text-sm mb-1">km/h</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-cyan-400/60 uppercase tracking-[0.3em]">mode</span>
          <span className="text-cyan-300 text-sm font-bold tracking-widest"
            style={{ textShadow: "0 0 12px rgba(100,220,255,0.9)" }}>
            HYPERSPEED
          </span>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <div className="flex gap-3 items-center">
            <span className="text-[10px] text-cyan-400/60 uppercase tracking-[0.3em]">tunnel depth</span>
            <div className="w-24 h-px bg-cyan-900 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-cyan-400 w-3/4"
                style={{ boxShadow: "0 0 8px rgba(100,200,255,0.8)" }} />
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-[10px] text-cyan-400/60 uppercase tracking-[0.3em]">signal</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => (
                <div key={index}
                  className="w-1 bg-cyan-400 rounded-sm"
                  style={{
                    height: `${8 + index * 3}px`,
                    opacity: index < 4 ? 1 : 0.3,
                    boxShadow: "0 0 4px rgba(100,200,255,0.8)"
                  }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="w-16 h-16 relative">
            <svg viewBox="0 0 64 64" className="w-full h-full" style={{ filter: "drop-shadow(0 0 6px rgba(100,200,255,0.7))" }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(100,200,255,0.2)" strokeWidth="1" />
              <circle cx="32" cy="32" r="20" fill="none" stroke="rgba(100,200,255,0.5)" strokeWidth="0.5" />
              <line x1="32" y1="8" x2="32" y2="14" stroke="rgba(100,200,255,0.8)" strokeWidth="1" />
              <line x1="32" y1="50" x2="32" y2="56" stroke="rgba(100,200,255,0.8)" strokeWidth="1" />
              <line x1="8" y1="32" x2="14" y2="32" stroke="rgba(100,200,255,0.8)" strokeWidth="1" />
              <line x1="50" y1="32" x2="56" y2="32" stroke="rgba(100,200,255,0.8)" strokeWidth="1" />
              <circle cx="32" cy="32" r="3" fill="rgba(100,220,255,0.9)" />
              <line x1="32" y1="32" x2="45" y2="20" stroke="rgba(100,220,255,0.9)" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-[9px] text-cyan-400/50 tracking-[0.2em]">NAVIGATION</span>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-6 h-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/70"
            style={{ boxShadow: "0 0 4px rgba(100,200,255,0.8)" }} />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/70"
            style={{ boxShadow: "0 0 4px rgba(100,200,255,0.8)" }} />
          <div className="absolute inset-1 border border-cyan-400/40 rounded-full" />
        </div>
      </div>
    </div>
  )
}
