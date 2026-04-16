"use client";
import ClosetNineGrid from '@/app/(app)/components/ui/ClosetNineGrid';
import { useGameStore } from '@/lib/state/gameStore';
import { GlassButton } from '@/components/GlassButton';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import backgroundImage from '../../../../../back2.jpg';

export default function StylingBoard() {
  const setPhase = useGameStore((s) => s.setPhase);
  const setLevel1Score = useGameStore((s) => s.setLevel1Score);
  const level1Score = useGameStore((s) => s.level1Score);
  const [unlocking, setUnlocking] = useState(false);

  const proceedToAccessorize = () => {
    const base = 50;
    const outfitScore = 10 + Math.floor(Math.random() * 11); // 10-20
    const total = Math.min(100, base + outfitScore);
    setLevel1Score(total);
    setUnlocking(true);
    setTimeout(() => setPhase('Accessorize'), 1200);
  };

  return (
    <div className="absolute inset-0 z-20 overflow-hidden">
      <img
        src={backgroundImage.src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,150,206,0.30),transparent_42%),radial-gradient(circle_at_85%_100%,rgba(231,127,181,0.22),transparent_44%),linear-gradient(135deg,rgba(255,236,246,0.34),rgba(255,243,250,0.28),rgba(251,228,238,0.38))]" />
      <div className="h-full w-full min-h-0 grid grid-cols-1 lg:grid-cols-[600px_1fr] xl:grid-cols-[640px_1fr] gap-4 p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="pointer-events-auto h-full min-h-0 flex flex-col max-h-[85vh]">
          <ClosetNineGrid />
        </div>
        <div className="pointer-events-none h-full min-h-0 flex flex-col max-h-[85vh]">
          {/* Center is rendered globally in page.tsx */}
        </div>
      </div>

      <AnimatePresence>
        {level1Score && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] rounded-xl bg-black/80 text-white px-4 py-3 text-center"
          >
            <div className="font-bold">Level 1 Complete ✅</div>
            <div>Score: {level1Score}/100</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30"
          >
            <motion.div
              initial={{ y: 26, scale: 0.92, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="rounded-2xl bg-black text-white px-8 py-6 text-center"
            >
              <div className="text-xl font-extrabold">⚡ Level 2 Unlocked: Accessories</div>
              <div className="text-sm mt-1">Add the perfect bag to boost your score</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <GlassButton
          variant="primary"
          size="lg"
          onClick={proceedToAccessorize}
          className="px-8 py-3 font-semibold shadow-xl"
        >
          <motion.span whileHover={{ x: 2 }} className="inline-flex items-center">
            Proceed to Accessorize →
          </motion.span>
        </GlassButton>
      </motion.div>
    </div>
  );
}

