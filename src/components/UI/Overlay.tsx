import { useStore } from '../../store/useStore'

export const Overlay = () => {
  const { handDetected, gesture, mode } = useStore()

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-8 flex flex-col justify-between z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          {/* <h1 className="text-4xl font-serif text-[#FFD700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider">
            LUXURY CHRISTMAS
          </h1>
          <p className="text-white/70 text-sm mt-1 font-light tracking-widest uppercase">
            Interactive Experience
          </p> */}
        </div>
        
        {/* Status Indicator */}
        <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-500 ${handDetected ? 'bg-green-900/40 border-green-500/50' : 'bg-red-900/40 border-red-500/50'}`}>
                <div className={`w-2 h-2 rounded-full ${handDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-xs text-white/90 font-medium tracking-wide">
                    {handDetected ? 'HAND DETECTED' : 'NO HAND DETECTED'}
                </span>
            </div>
            
            {handDetected && (
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-[#FFD700] font-bold">
                        GESTURE: {gesture}
                    </span>
                 </div>
            )}
        </div>
      </div>

      {/* Center Instructions (Only show when no hand or idle) */}
      {!handDetected && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-white/60 text-lg font-light tracking-widest animate-pulse">
                  PLEASE ENABLE CAMERA & SHOW YOUR HAND
              </div>
          </div>
      )}

      {/* Footer Controls / Hints */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
            <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                    ✊
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#FFD700]">FIST</span>
                    <span className="text-[10px] uppercase tracking-wider">Form Tree</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                    🖐️
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#FFD700]">OPEN HAND</span>
                    <span className="text-[10px] uppercase tracking-wider">Release Magic</span>
                </div>
            </div>
        </div>

        <div className="text-right">
             <div className="text-5xl font-serif text-white/10 font-bold">
                {mode === 'TREE' ? 'FORMED' : 'CHAOS'}
             </div>
        </div>
      </div>
    </div>
  )
}
