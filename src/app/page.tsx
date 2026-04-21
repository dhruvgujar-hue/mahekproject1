"use client";
import { useGameStore } from '@/lib/state/gameStore';
import { useEffect, useState } from 'react';
import { Confetti } from '@/components/Confetti';
import TopBar from '@/app/(app)/components/game/TopBar';
import CenterStage from '@/app/(app)/components/game/CenterStage';
import HistoryStrip from '@/app/(app)/components/game/HistoryStrip';
import GameBoard from '@/app/(app)/components/game/GameBoard';
import StylingBoard from '@/app/(app)/components/game/StylingBoard';
import AccessorizeBoard from '@/app/(app)/components/game/AccessorizeBoard';
import EvaluationBoard from '@/app/(app)/components/game/EvaluationBoard';
import EditWithAIPanel from '@/app/(app)/components/panels/EditWithAIPanel';
import { DebugPanel } from '@/components/DebugPanel';
import { GlassButton } from '@/components/GlassButton';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import UrgencyVignette from '@/app/(app)/components/game/UrgencyVignette';
import { useDebugStore } from '@/lib/state/debugStore';
import { canUseShopping, canUseEdit, canOpenWardrobe, shoppingTooltipFor, editTooltipFor, wardrobeTooltipFor } from '@/lib/constants/phasePermissions';
import { AnimatePresence, motion } from 'framer-motion';
import backgroundImage from '../../back2.jpg';
import ramp3Image from '../../ramp3.png';

const PRESET_MODEL_URL = '/character/tina-removebg-preview.png';

export default function GamePage() {
  const phase = useGameStore((s) => s.phase);
  const playerName = useGameStore((s) => s.playerName);
  const theme = useGameStore((s) => s.theme);
  const character = useGameStore((s) => s.character);
  const currentImageUrl = useGameStore((s) => s.currentImageUrl);
  const runwayBaseImageUrl = useGameStore((s) => s.runwayBaseImageUrl);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetGame = useGameStore((s) => s.resetGame);
  const setCharacter = useGameStore((s) => s.setCharacter);
  const setCurrentImage = useGameStore((s) => s.setCurrentImage);
  const setCurrentImageId = useGameStore((s) => s.setCurrentImageId);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const { showToast, ToastContainer } = useToast();
  
  // Panel visibility states
  const [isEditPanelVisible, setEditPanelVisible] = useState(false);
  // Inline wardrobe during StylingRound: no modal anymore
  const [isWardrobeOpen, setWardrobeOpen] = useState(false);
  // Character selection on start screen
  const [selectedCharacterUrl, setSelectedCharacterUrl] = useState<string | null>(null);

  // Global confetti triggers (left and right side bursts)
  const [leftConfettiTrigger, setLeftConfettiTrigger] = useState(false);
  const [rightConfettiTrigger, setRightConfettiTrigger] = useState(false);
  const [leftSource, setLeftSource] = useState<{ x: number; y: number; w: number; h: number } | undefined>(undefined);
  const [rightSource, setRightSource] = useState<{ x: number; y: number; w: number; h: number } | undefined>(undefined);

  console.log('🚀 INITIAL RENDER: Page component is executing');

  // Phase-based gating
  const muteToasts = useDebugStore((s) => s.muteToasts);

  const canOpenShopping = canUseShopping(phase);
  const canEdit = canUseEdit(phase);
  const canWardrobe = canOpenWardrobe(phase);
  const shoppingTooltip = shoppingTooltipFor(phase);
  const editTooltip = editTooltipFor(phase);
  const wardrobeTooltip = wardrobeTooltipFor(phase);
  
  // Auto-reset once every 3 hours on first visit in that window, after hydration
  useEffect(() => {
    const RESET_KEY = 'dti:lastResetAt';
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    const maybeReset = () => {
      try {
        const last = Number(localStorage.getItem(RESET_KEY) || '0');
        const now = Date.now();
        if (!last || now - last >= THREE_HOURS_MS) {
          resetGame();
          localStorage.setItem(RESET_KEY, String(now));
        }
      } catch {
        // no-op
      }
    };

    try {
      const persistApi = (useGameStore as any)?.persist;
      // If already hydrated, run now
      if (persistApi?.hasHydrated?.()) {
        maybeReset();
      }
      // Also run after hydration completes
      const unsub = persistApi?.onFinishHydration?.(() => {
        maybeReset();
      });
      return () => { try { unsub?.(); } catch {} };
    } catch {
      // Fallback: best effort single run
      maybeReset();
    }
  }, [resetGame]);

  useEffect(() => {
    console.log('🚀 DRESS TO IMPRESS: Application started');
    console.log('🎯 INITIAL STATE:', { 
      phase, 
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    
    // Log environment status
    // Note: Other env vars are not accessible on client side
    
    console.log('🔧 CLIENT ENVIRONMENT:', {
      nodeEnv: process.env.NODE_ENV,
      // Server-side env vars will be logged on API calls
    });
    
    console.log('📱 BROWSER CAPABILITIES:', {
      webrtc: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      localStorage: typeof Storage !== 'undefined',
      webgl: !!document.createElement('canvas').getContext('webgl'),
    });
    
    console.log('🎮 GAME FLOW: Starting in phase', phase);
    console.log('💡 TIP: Press Ctrl+Shift+D to open debug panel (development only)');
    console.log('⌨️  KEYBOARD: Press ESC to close panels, click Phase to cycle');
  }, [phase]);

  // Ensure a visible default model when there is no styling history AND no character selected.
  useEffect(() => {
    const gs = useGameStore.getState();
    // Only set fallback if no character has been selected yet
    if (!gs.character && gs.history.length === 0) {
      const fallback = { id: 'fashn-model', avatarUrl: PRESET_MODEL_URL };
      setCharacter(fallback);
      setCurrentImage(PRESET_MODEL_URL);
      setCurrentImageId(null);
    }
  }, [setCharacter, setCurrentImage, setCurrentImageId]);

  // Listen for global confetti events so celebrations outlive panel unmounts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ side?: 'left' | 'right' | 'both'; pieces?: number }>).detail || {};
      const side = detail.side || 'both';
      const width = typeof window !== 'undefined' ? window.innerWidth : 0;
      const height = typeof window !== 'undefined' ? window.innerHeight : 0;
      const leftRect = { x: 0, y: 0, w: Math.max(16, Math.round(width * 0.02)), h: height };
      const rightRect = { x: Math.max(0, width - Math.max(16, Math.round(width * 0.02))), y: 0, w: Math.max(16, Math.round(width * 0.02)), h: height };
      if (side === 'left' || side === 'both') {
        setLeftSource(leftRect);
        setLeftConfettiTrigger((t) => !t);
      }
      if (side === 'right' || side === 'both') {
        setRightSource(rightRect);
        setRightConfettiTrigger((t) => !t);
      }
    };
    window.addEventListener('GLOBAL_CONFETTI', handler as EventListener);
    return () => window.removeEventListener('GLOBAL_CONFETTI', handler as EventListener);
  }, []);

  // Auto-close disallowed panels on phase changes
  useEffect(() => {
    if (phase === 'ShoppingSpree') {
      setEditPanelVisible(false);
      setWardrobeOpen(false);
    } else if (phase === 'StylingRound') {
      setEditPanelVisible(false);
      // Wardrobe becomes the left inline panel; keep flag for keyboard shortcut UX
      setWardrobeOpen(true);
    } else if (phase === 'Accessorize') {
      // Inline editor now; keep sidebars closed
      setWardrobeOpen(false);
      setEditPanelVisible(false);
      try {
        const gs = useGameStore.getState();
        gs.setAccessorizeUsed(false);
        // Snapshot the styled look so it remains stable through scoring.
        if (!gs.runwayBaseImageUrl && gs.currentImageUrl) {
          gs.setRunwayBaseImageUrl(gs.currentImageUrl);
        }
      } catch {}
    } else {
      // In other phases, close all tool panels
      setEditPanelVisible(false);
      setWardrobeOpen(false);
    }
  }, [phase]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts while typing
      const active = document.activeElement as HTMLElement | null;
      const isTyping = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping) return;

      const key = e.key.toLowerCase();

      if (key === 'escape') {
        setEditPanelVisible(false);
        setWardrobeOpen(false);
        return;
      }

      // Only enable tool shortcuts outside of CharacterSelect
      if (phase === 'CharacterSelect') return;

      if (key === 's') {
        if (!canOpenShopping) {
          if (!muteToasts) showToast(shoppingTooltip, 'info');
          return;
        }
        // Shopping lives in the left sidebar now; nothing to open
        if (!muteToasts) showToast('Use the left Generate panel to search.', 'info');
      } else if (key === 'e') {
        if (!canEdit) {
          if (!muteToasts) showToast(editTooltip, 'info');
          return;
        }
        // In Accessorize, focus inline input instead of opening modal
        if (phase === 'Accessorize') {
          try { window.dispatchEvent(new CustomEvent('ACCESSORIZE_EVT', { detail: 'FOCUS_ACCESSORIZE_INPUT' })); } catch {}
          return;
        }
        // Open modal editor in other phases if ever needed
        setWardrobeOpen(false);
        setEditPanelVisible(true);
      } else if (key === 'w') {
        if (!canWardrobe) {
          if (!muteToasts) showToast(wardrobeTooltip, 'info');
          return;
        }
        // Toggle inline Wardrobe in StylingRound; no modal
        setEditPanelVisible(false);
        setWardrobeOpen((v) => !v);
      } else if (key === 'a') {
        if (!muteToasts) showToast('AI opponent is disabled in single-player mode.', 'info', 1800);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [phase]);
  
  // Guard: skip legacy ThemeSelect; CharacterSelect is now our start screen.
  useEffect(() => {
    if (phase === 'ThemeSelect') setPhase('CharacterSelect');
  }, [phase, setPhase]);

  // Theme wheel removed; phase now advances directly from CharacterSelect to ShoppingSpree.

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Tiny reset button (top-left) */}
      <div className="fixed top-3 left-3 z-[100]">
        <GlassButton
          size="sm"
          title="Reset game"
          aria-label="Reset game"
          onClick={() => {
            if (confirm('Reset game and reload?')) {
              try {
                const now = Date.now();
                localStorage.setItem('dti:lastResetAt', String(now));
                resetGame();
              } catch {}
              window.location.reload();
            }
          }}
        >
          <RotateCcw className="w-4 h-4" />
        </GlassButton>
      </div>
      {/* Canvas Background - CenterStage takes full viewport */}
      <CenterStage />
      {/* Urgency vignette overlay during last seconds */}
      <UrgencyVignette />
      
      {/* Fixed positioned overlay elements */}
      {phase !== 'Evaluation' && phase !== 'CharacterSelect' && phase !== 'Results' && <TopBar />}
      {phase !== 'Results' && phase !== 'Evaluation' && phase !== 'StylingRound' && <HistoryStrip />}
      
      {/* Board layout (single screen) during gameplay phases */}
      {phase !== 'Evaluation' && phase !== 'CharacterSelect' && (
        phase === 'StylingRound'
          ? <StylingBoard />
          : phase === 'Accessorize'
            ? <AccessorizeBoard />
            : phase === 'ShoppingSpree'
              ? <GameBoard />
              : null
      )}

      {/* Conditional rendering based on phase */}
      {(() => {
        console.log('🎮 GAME PAGE: Current phase is', phase);
        return null;
      })()}
      {phase === 'CharacterSelect' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={backgroundImage.src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-72"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF2E7]/55 via-[#FFF7EC]/48 to-[#EFE2D4]/56" />
          <motion.div
            className="absolute -top-20 -left-16 w-80 h-80 rounded-full bg-amber-300/25 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -right-16 w-96 h-96 rounded-full bg-rose-300/20 blur-3xl"
            animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.35, 0.2, 0.35] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative w-full max-w-2xl rounded-3xl border border-foreground/15 bg-white/90 dark:bg-black/60 backdrop-blur-md p-8 text-center space-y-6 shadow-2xl"
          >
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="text-4xl font-extrabold tracking-tight"
            >
              🎯 ELIE SAAB STYLE CHALLENGE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="text-foreground/80"
            >
              Enter your name and choose your character
            </motion.p>

            {/* Name input */}
            <motion.input
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.3 }}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl border border-foreground/20 bg-background text-foreground text-center"
            />

            {/* Character selection grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
            >
              <p className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">Choose Your Character</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'tina', name: 'Tina', url: '/character/tina-removebg-preview.png' },
                  { id: 'mira', name: 'Mira', url: '/character/mira-murati-removebg-preview.png' },
                  { id: 'sarah', name: 'Sarah', url: '/character/sarah-guo-removebg-preview.png' },
                ].map((char) => {
                  const isSelected = selectedCharacterUrl === char.url;
                  return (
                    <motion.div
                      key={char.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCharacterUrl(char.url)}
                      className={`relative cursor-pointer rounded-2xl p-3 transition-all duration-200 ${
                        isSelected
                          ? 'bg-foreground/10 border-2 border-foreground/40 shadow-lg ring-2 ring-foreground/20'
                          : 'bg-foreground/5 border-2 border-transparent hover:bg-foreground/8 hover:border-foreground/15'
                      }`}
                    >
                      <div className="aspect-[3/4] flex items-center justify-center overflow-hidden rounded-xl">
                        <img
                          src={char.url}
                          alt={char.name}
                          className="h-full w-full object-contain drop-shadow-md"
                        />
                      </div>
                      <p className={`mt-2 text-sm font-bold ${isSelected ? 'text-foreground' : 'text-foreground/60'}`}>
                        {char.name}
                      </p>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedCharacterUrl
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-foreground/30 text-background/60 cursor-not-allowed'
              }`}
              disabled={!selectedCharacterUrl}
              onClick={() => {
                if (!selectedCharacterUrl) return;
                const name = (useGameStore.getState().playerName || 'Player').trim() || 'Player';
                setPlayerName(name);
                const charData = { id: `selected-char-${Date.now()}`, avatarUrl: selectedCharacterUrl };
                setCharacter(charData);
                setCurrentImage(selectedCharacterUrl);
                setCurrentImageId(null);
                showToast(`${name} enters the styling arena... 🔥`, 'success', 2600);
                setPhase('ShoppingSpree');
              }}
            >
              {selectedCharacterUrl ? 'Enter Game →' : 'Select a character first'}
            </motion.button>
          </motion.div>
        </div>
      ) : phase === 'Evaluation' ? (
        <EvaluationBoard />
      ) : null}
      
      {/* Amazon modal removed in single-screen layout; generation lives in left sidebar */}
      
      {isEditPanelVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)]">
          <div 
            className="fixed inset-0"
            onClick={() => setEditPanelVisible(false)}
          />
          <div className="relative max-w-4xl w-full mx-4 max-h-[90vh]">
            <EditWithAIPanel onClose={() => setEditPanelVisible(false)} />
          </div>
        </div>
      )}
      
      {/* Wardrobe modal removed; handled inline in boards */}
      
      {/* AI Console dialog not needed; logs live on the right in the board */}
      <DebugPanel />
      
      {/* Results overlay */}
      {phase === 'Results' && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Ramp runway background (New ramp3.png) */}
          <img
            src={ramp3Image.src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          
          {/* Title - Moved to absolute top to not block ELIESAAB */}
          <div className="absolute top-8 left-0 right-0 text-center z-20">
            <p className="text-xs uppercase tracking-[0.35em] text-white/90 drop-shadow-lg">Final Presentation</p>
            <h2 className="mt-2 text-4xl font-extrabold text-white drop-shadow-xl">Your Styled Look</h2>
          </div>

          {/* Centered avatar on the ramp */}
          <div className="relative flex flex-col min-h-full items-center justify-center px-5">
            {/* Avatar container - Pushed down to sit below ELIESAAB text */}
            <div className="relative z-10 flex items-center justify-center w-full translate-y-[10vh]" style={{ maxHeight: '62vh' }}>
              {/* Backlight spotlight to make mix-blend-multiply work beautifully on a dark background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[70vh] bg-white opacity-80 blur-[100px] rounded-full pointer-events-none"></div>
              
              {(runwayBaseImageUrl || currentImageUrl) ? (
                <img
                  src={runwayBaseImageUrl || currentImageUrl || ''}
                  alt="Final look"
                  className="relative z-10 max-h-[62vh] max-w-[50vw] object-contain mix-blend-multiply"
                />
              ) : null}
            </div>

            {/* Buttons - Pushed down as well */}
            <div className="mt-12 translate-y-[10vh] flex flex-wrap items-center justify-center gap-3 z-10">
              <button
                className="px-6 py-2.5 rounded-lg bg-white text-black font-semibold hover:bg-white/90 shadow-xl transition-all"
                onClick={() => { resetGame(); }}
              >
                Restart
              </button>
              <button
                className="px-6 py-2.5 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 border border-white/30 backdrop-blur-sm shadow-xl transition-all"
                onClick={() => { setPhase('StylingRound'); }}
              >
                Back to styling
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessorize navigation controls (Skip only) */}
      {phase === 'Accessorize' && (
        <div className="fixed inset-x-0 bottom-4 z-[80] pointer-events-none">
          <div className="mx-auto max-w-5xl px-4 flex items-center justify-center gap-3">
            <button
              className="pointer-events-auto px-4 py-2 rounded-lg bg-white/90 text-black hover:bg-white border border-gray-300 shadow-lg backdrop-blur-sm font-medium"
              onClick={() => { if (!muteToasts) showToast('Skipping accessories—heading to evaluation.', 'info', 2000); setEditPanelVisible(false); setPhase('Evaluation'); }}
            >
              Click to begin GPT-5 Evaluation →
            </button>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer />

      {/* Global Confetti (renders above all content via portal) */}
      <Confetti trigger={leftConfettiTrigger} source={leftSource} pieces={200} />
      <Confetti trigger={rightConfettiTrigger} source={rightSource} pieces={200} />
    </main>
  );
}
