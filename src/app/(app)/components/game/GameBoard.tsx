"use client";
import GenerateSidebar from '@/app/(app)/components/ui/GenerateSidebar';
import ClosetNineGrid from '@/app/(app)/components/ui/ClosetNineGrid';
import { useToast } from '@/hooks/useToast';
import { useGameStore } from '@/lib/state/gameStore';
import backgroundImage from '../../../../../back2.jpg';

export default function GameBoard() {
  const { showToast } = useToast();
  const wardrobe = useGameStore((s) => s.wardrobe);
  const setPhase = useGameStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 z-20 overflow-hidden">
      <img
        src={backgroundImage.src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_15%,rgba(255,152,204,0.28),transparent_40%),radial-gradient(circle_at_90%_90%,rgba(232,132,186,0.24),transparent_46%),linear-gradient(135deg,rgba(255,235,245,0.38),rgba(255,243,250,0.30),rgba(252,232,241,0.40))] backdrop-blur-[1.5px]" />
      <div className="h-full w-full min-h-0 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="pointer-events-auto h-full min-h-0 flex flex-col max-h-[85vh]">
          <GenerateSidebar showToast={showToast} className="h-full" />
        </div>
        <div className="pointer-events-auto h-full min-h-0 flex flex-col max-h-[85vh]">
          <ClosetNineGrid />
        </div>
      </div>

      {wardrobe.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[75] pointer-events-none">
          <button
            className="pointer-events-auto rounded-full border border-[#E3A2C8] bg-white/88 px-5 py-3 text-sm font-semibold text-[#2D1A2A] shadow-[0_12px_30px_rgba(160,80,125,0.22)] backdrop-blur-md transition-transform hover:scale-[1.02]"
            onClick={() => {
              setPhase('StylingRound');
              showToast('Opening apply stage...', 'success');
            }}
          >
            Apply on avatar
          </button>
        </div>
      )}
    </div>
  );
}

