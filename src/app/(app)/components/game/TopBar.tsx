"use client";
import { useGameStore } from '@/lib/state/gameStore';
import { createCountdown } from '@/lib/util/timers';
import { useEffect, useRef } from 'react';
import { GlassPanel } from '@/components/GlassPanel';
import { useToast } from '@/hooks/useToast';
import { GAME_PHASES } from '@/lib/constants/gamePhases';
import { MAX_WARDROBE_ITEMS } from '@/lib/constants';
import { useDebugStore } from '@/lib/state/debugStore';

export default function TopBar() {
  const phase = useGameStore((s) => s.phase);
  const theme = useGameStore((s) => s.theme);
  const timer = useGameStore((s) => s.timer);
  const setTimer = useGameStore((s) => s.setTimer);
  const setPhase = useGameStore((s) => s.setPhase);
  const wardrobe = useGameStore((s) => s.wardrobe);
  const resetGame = useGameStore((s) => s.resetGame);
  const stopRef = useRef<null | (() => void)>(null);
  const { showToast } = useToast();
  const muteToasts = useDebugStore((s) => s.muteToasts);
  const disableAutoTimers = useDebugStore((s) => s.disableAutoTimers);
  const thresholdsShownRef = useRef<Set<string>>(new Set());
  const lastPhaseRef = useRef<string | null>(null);
  const wardrobeFullClampedRef = useRef<boolean>(false);
  
  const phases = GAME_PHASES;
  type GamePhase = (typeof GAME_PHASES)[number];
  
  const nextPhase = () => {
    const currentIndex = phases.indexOf(phase as GamePhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    setPhase(phases[nextIndex]);
  };

  useEffect(() => {
    // Timers
    stopRef.current?.();
    if (!disableAutoTimers) {
      if (phase === 'ShoppingSpree') {
        stopRef.current = createCountdown(105, (s) => setTimer(s), () => setPhase('StylingRound'));
      } else if (phase === 'StylingRound') {
        stopRef.current = createCountdown(300, (s) => setTimer(s), () => setPhase('Accessorize'));
      } else {
        stopRef.current = null;
      }
    } else {
      stopRef.current = null;
    }
    // Reset threshold tracking on phase change and show toasts
    thresholdsShownRef.current.clear();
    if (lastPhaseRef.current !== phase) {
      // Transition toasts (previous -> current)
      if (!muteToasts) {
        if (lastPhaseRef.current === 'ShoppingSpree' && phase === 'StylingRound') {
          showToast("Time's up! Moving to Styling.", 'success', 2000);
        }
        if (lastPhaseRef.current === 'StylingRound' && phase === 'Accessorize') {
          showToast("Time's up! Moving to Accessorize.", 'success', 2200);
        }
      }
      // Phase start toasts (current)
      if (!muteToasts) {
        if (phase === 'ShoppingSpree') {
          showToast('Shopping started. You have 1:45.', 'info', 2500);
        }
        if (phase === 'StylingRound') {
          showToast('Styling started. You have 5:00.', 'info', 2500);
        }
        if (phase === 'Accessorize') {
          showToast('Accessorize: one AI edit for finishing touches (30–100s). Combine instructions; you’ll get 4 options.', 'info', 3600);
        }
      }
      lastPhaseRef.current = phase;
    }
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [phase, setPhase, setTimer, disableAutoTimers, muteToasts]);

  // Effect to clamp timer to 25 seconds when wardrobe is full during ShoppingSpree
  useEffect(() => {
    if (phase === 'ShoppingSpree' && wardrobe.length === MAX_WARDROBE_ITEMS && !wardrobeFullClampedRef.current) {
      // Mark as clamped to avoid repeated triggers
      wardrobeFullClampedRef.current = true;
      
      // Stop current timer
      stopRef.current?.();
      
      // Show toast notification
      if (!muteToasts) {
        showToast('All clothing slots filled! Timer reduced to 25 seconds.', 'success', 2500);
      }
      
      // Start new 25-second timer
      if (!disableAutoTimers) {
        stopRef.current = createCountdown(25, (s) => setTimer(s), () => setPhase('StylingRound'));
      }
    }
    
    // Reset the clamped flag when phase changes
    if (phase !== 'ShoppingSpree') {
      wardrobeFullClampedRef.current = false;
    }
  }, [phase, wardrobe.length, setTimer, setPhase, disableAutoTimers, muteToasts, showToast]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Round label mapping for visual header only (UI change only)
  const roundInfo = (() => {
    if (phase === 'ShoppingSpree') return { num: 1, title: 'Pick Your Clothes' } as const;
    if (phase === 'StylingRound') return { num: 2, title: 'Style Your Outfit' } as const;
    if (phase === 'Accessorize') return { num: 3, title: 'Accessorize' } as const;
    return null;
  })();

  // Threshold toasts for time remaining
  useEffect(() => {
    if (timer <= 0) return;
    const key = (mark: number) => `${phase}:${mark}`;
    const shown = thresholdsShownRef.current;
    const emit = (mark: number, message: string, type: 'info' | 'warning', duration = 2000) => {
      const k = key(mark);
      if (shown.has(k)) return;
      shown.add(k);
      if (!muteToasts) showToast(message, type, duration);
    };
    if (phase === 'ShoppingSpree') {
      if (timer === 30) emit(30, '30 seconds remaining before Styling.', 'warning', 2000);
      if (timer === 10) emit(10, '10 seconds remaining before Styling.', 'warning', 1800);
    } else if (phase === 'StylingRound') {
      if (timer === 45) emit(45, '0:45 remaining.', 'info', 2200);
      if (timer === 20) emit(20, '20 seconds remaining before Accessorize.', 'warning', 2000);
      if (timer === 10) emit(10, '10 seconds remaining before Accessorize.', 'warning', 1800);
    }
  }, [timer, phase, showToast, muteToasts]);

  return (
    <div className={`fixed top-2 left-1/2 -translate-x-1/2 z-[70] w-full max-w-2xl px-4 pointer-events-none ${phase === 'ThemeSelect' ? 'pointer-events-none' : ''}`}>
      <GlassPanel className="px-4 py-2.5 text-center border border-[#EAB5D9]/65 bg-gradient-to-r from-[#FFF4FA]/85 via-[#FFEAF4]/78 to-[#FFF0F8]/85 backdrop-blur-md shadow-[0_14px_34px_rgba(178,98,150,0.24)]">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Brand */}
          <h2 className="text-lg md:text-xl font-extrabold text-[#2D1A2A]">
            <span className="text-[#BE5D93]">ELIE SAAB ATELIER:</span> {theme}
          </h2>

          {/* Round pill */}
          {roundInfo && (
            <div className="inline-flex items-center rounded-lg border border-[#D88CB8] bg-white/62 px-2.5 py-1">
              <span className="font-extrabold text-[#B15D90] mr-1.5 text-xs">ROUND {roundInfo.num}:</span>
              <span className="font-semibold text-[#2D1A2A] text-xs">{roundInfo.title}</span>
            </div>
          )}

          {/* Timer */}
          {timer > 0 && phase !== 'Accessorize' && (
            <div className="text-lg font-extrabold text-[#2D1A2A] font-mono">
              {formatTime(timer)}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

