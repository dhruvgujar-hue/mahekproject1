'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/state/gameStore';
import { useToast } from '@/hooks/useToast';
import { performTryOn } from '@/lib/adapters/fashn';
import { selectImage } from '@/lib/services/stateActions';
import { AnimatePresence, motion } from 'framer-motion';

export default function AccessorizeBoard() {
  const phase = useGameStore((s) => s.phase);
  const theme = useGameStore((s) => s.theme);
  const playerName = useGameStore((s) => s.playerName);
  const character = useGameStore((s) => s.character);
  const currentImageUrl = useGameStore((s) => s.currentImageUrl);
  const runwayBaseImageUrl = useGameStore((s) => s.runwayBaseImageUrl);
  const setEvaluationResult = useGameStore((s) => s.setEvaluationResult);
  const setPhase = useGameStore((s) => s.setPhase);
  const level1Score = useGameStore((s) => s.level1Score);
  const { showToast } = useToast();

  const [bagLoading, setBagLoading] = useState(false);
  const [bagApplied, setBagApplied] = useState(false);
  const [bagBoost, setBagBoost] = useState<number>(0);
  const [comboBonus, setComboBonus] = useState<number>(0);
  const [randomBonus, setRandomBonus] = useState<number>(0);

  if (phase !== 'Accessorize') return null;

  const playerImage = runwayBaseImageUrl || currentImageUrl || character?.avatarUrl || '';

  async function applyBag(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a bag image', 'error');
      return;
    }
    if (!playerImage) return;
    setBagLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const images = await performTryOn(playerImage, dataUrl);
      const bagImage = images[0];
      if (bagImage) {
        await selectImage(bagImage, { type: 'tryOn', description: 'Bag accessory applied', addToHistory: true });
      }
      const boost = 10 + Math.floor(Math.random() * 11); // 10-20
      const combo = Math.random() > 0.5 ? 10 : 0;
      const surprise = Math.random() > 0.6 ? 5 : 0;
      setBagBoost(boost);
      setComboBonus(combo);
      setRandomBonus(surprise);
      setBagApplied(true);
      showToast(`+${boost} Style Boost 💼`, 'success', 2200);
      if (combo) showToast('✨ COMBO BONUS +10', 'success', 2200);
      if (surprise) showToast('🎁 Surprise Boost +5', 'success', 2200);
    } catch {
      showToast('Bag apply failed. Try another image.', 'error', 2200);
    } finally {
      setBagLoading(false);
    }
  }

  const finalizeScore = () => {
    const level1 = level1Score ?? 65;
    const playerScore = Math.min(100, level1 + bagBoost + comboBonus + randomBonus);
    const grade =
      playerScore >= 90 ? '👑 Style King' :
      playerScore >= 75 ? '🔥 Trendsetter' :
      playerScore >= 50 ? '👍 Good Fit' :
      '😬 Needs Work';
    setEvaluationResult({
      playerScore,
      aiScore: 0,
      playerThemeScore: Math.min(10, Math.round(playerScore / 10)),
      aiThemeScore: 0,
      playerOutfitScore: Math.min(10, Math.round((level1 / 100) * 10)),
      aiOutfitScore: 0,
      winner: 'player',
      reasoning: `${grade} • Can you beat your score?`,
    });
    setPhase('Evaluation');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm pt-36 md:pt-40"
    >
      <div className="h-full w-full min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Left: bag upload + live preview */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="pointer-events-auto h-full min-h-0 flex flex-col"
        >
          <motion.div
            whileHover={{ y: -2 }}
            className="h-full max-h-[85vh] rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-foreground/10 shadow-xl p-4 flex flex-col"
          >
            <div className="text-center mb-4">
              <div className="text-xl font-extrabold">⚡ Level 2: Accessories</div>
                <div className="text-sm text-foreground/70">Bag is optional. You can apply one or go ahead without it.</div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              <div className="rounded-2xl overflow-hidden bg-background/50 p-2 flex items-center justify-center">
                {playerImage ? (
                  <motion.img
                    key={playerImage}
                    initial={{ opacity: 0.65, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    src={playerImage}
                    alt="Player look"
                    className={`max-w-full max-h-[55vh] object-contain rounded-xl ${bagApplied ? 'ring-4 ring-yellow-300 animate-pulse' : ''}`}
                  />
                ) : (
                  <div className="text-foreground/60 text-sm">No look selected</div>
                )}
              </div>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void applyBag(file);
                    e.currentTarget.value = '';
                  }}
                  disabled={bagLoading}
                />
                <motion.span
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center px-3 py-3 rounded-xl border border-border bg-[#7D8FE2]/10 text-foreground cursor-pointer hover:bg-[#7D8FE2]/20 transition-colors"
                >
                  {bagLoading ? 'Applying bag...' : 'Upload bag & apply'}
                </motion.span>
              </label>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex w-full items-center justify-center px-3 py-3 rounded-xl border border-dashed border-[#E3A2C8] bg-white/70 text-foreground font-semibold hover:bg-white/80 transition-colors"
                onClick={finalizeScore}
              >
                Go ahead without bag
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: score panel */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="h-full min-h-0 flex flex-col"
        >
          <motion.div
            whileHover={{ y: -2 }}
            className="h-full max-h-[85vh] rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-foreground/10 shadow-xl overflow-hidden relative"
          >
            <div className="relative z-20 p-4 flex-shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/10 text-foreground text-sm font-semibold w-max">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Player: {playerName || 'Player'}
              </div>
            </div>
            <div className="absolute inset-0 z-0">
              {playerImage ? (
                <img
                  src={playerImage}
                  alt="Your current look"
                  className="w-full h-full object-cover blur-xl opacity-30"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-200/30 via-teal-200/20 to-cyan-200/30" />
              )}
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-full border-4 border-foreground/20 ${bagApplied ? 'border-green-500' : 'border-t-foreground animate-spin'}`} />
                <div className="mt-3 text-foreground font-semibold">
                  {bagLoading && 'Applying accessory...'}
                  {!bagLoading && bagApplied && 'Bag applied ✨'}
                  {!bagLoading && !bagApplied && 'Upload a bag to continue'}
                </div>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`boost-${bagBoost}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-foreground/80 font-mono px-3"
                  >
                    +{bagBoost} Style Boost 💼
                  </motion.div>
                </AnimatePresence>
                {comboBonus > 0 && <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-foreground/80 font-mono">✨ COMBO BONUS +{comboBonus}</motion.div>}
                {randomBonus > 0 && <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-foreground/80 font-mono">🎁 Surprise Boost +{randomBonus}</motion.div>}
                <motion.button
                  whileHover={{ scale: bagApplied ? 1.03 : 1 }}
                  whileTap={{ scale: bagApplied ? 0.97 : 1 }}
                  className="mt-4 px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
                  onClick={finalizeScore}
                >
                  {bagApplied ? 'Reveal Final Score' : 'Go ahead without bag'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
