"use client";
import { useGameStore } from '@/lib/state/gameStore';

export default function CenterStage() {
  const currentImageUrl = useGameStore((s) => s.currentImageUrl);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'StylingRound') return null;

  return (
    <div className="absolute inset-0 z-[60] pointer-events-none">
      {currentImageUrl ? (
        <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-[34vw] max-w-[520px] min-w-[260px]">
          <div className="rounded-[28px] border border-white/55 bg-white/08 shadow-[0_18px_42px_rgba(85,30,70,0.24)] p-4 md:p-5">
            <img
              src={currentImageUrl}
              alt="Current styling"
              className="w-full max-h-[72vh] object-contain opacity-95 contrast-95 saturate-100 brightness-95 drop-shadow-[0_12px_22px_rgba(70,28,58,0.28)]"
            />
          </div>
        </div>
      ) : (
        <div className="absolute right-[6%] top-1/2 -translate-y-1/2 text-center space-y-4 z-10 opacity-60">
          <div className="w-20 h-20 mx-auto rounded-full bg-foreground/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-medium text-foreground">Center Stage</h3>
            <p className="text-foreground/70">Your styled look will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}


