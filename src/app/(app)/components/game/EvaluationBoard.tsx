'use client';

import { useGameStore } from '@/lib/state/gameStore';
import { GlassPanel } from '@/components/GlassPanel';
import { motion } from 'framer-motion';

export default function EvaluationBoard() {
  const phase = useGameStore((s) => s.phase);
  const theme = useGameStore((s) => s.theme);
  const currentImageUrl = useGameStore((s) => s.currentImageUrl);
  const runwayBaseImageUrl = useGameStore((s) => s.runwayBaseImageUrl);
  const evaluationResult = useGameStore((s) => s.evaluationResult);
  const setPhase = useGameStore((s) => s.setPhase);
  const setEvaluationResult = useGameStore((s) => s.setEvaluationResult);
  const character = useGameStore((s) => s.character);
  
  // Use the player's final selected image (runway base or current)
  const playerFinalImage = currentImageUrl || runwayBaseImageUrl || character?.avatarUrl;

  const proceedToResults = () => {
    setPhase('Results');
  };

  const gradeLabel = evaluationResult
    ? evaluationResult.playerScore >= 90
      ? '👑 Style King'
      : evaluationResult.playerScore >= 75
        ? '🔥 Trendsetter'
        : evaluationResult.playerScore >= 50
          ? '👍 Good Fit'
          : '😬 Needs Work'
    : '';

  if (phase !== 'Evaluation') return null;

  // Show a loading state if image or score is not ready
  if (!playerFinalImage || !evaluationResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4"
      >
        <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
          <GlassPanel variant="card" className="max-w-lg w-full text-center">
          {/* Animated spinner with pulse effect */}
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-primary/10 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 animate-pulse">Preparing score...</h2>
          </GlassPanel>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 bg-background overflow-auto"
    >
      <div className="min-h-full flex flex-col items-center justify-center p-4 py-8">
        <div className="w-full max-w-6xl space-y-6">
          
          {/* Brand theme display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ELIE SAAB ATELIER: <span className="font-semibold text-foreground">{theme}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Player Card */}
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.06, duration: 0.35 }}>
              <GlassPanel variant="card" className="bg-yellow-50 border-yellow-200">
              <div className="text-center space-y-4">
                <div className="inline-block bg-yellow-200 px-4 py-2 rounded-full">
                  <h2 className="font-bold">You</h2>
                </div>
                
                <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-sm mx-auto max-w-[200px] sm:max-w-[250px]">
                  {playerFinalImage ? (
                    <motion.img
                      key={playerFinalImage}
                      initial={{ opacity: 0.7, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      src={playerFinalImage} 
                      alt="Your final look" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No final look selected
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                    <div className="bg-yellow-200/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Score</p>
                      <p className="text-2xl font-bold">
                        {evaluationResult ? evaluationResult.playerScore.toFixed(1) : '-.-'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Theme:</span>
                      <span>{evaluationResult ? `${evaluationResult.playerThemeScore}/10` : '-/10'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outfit:</span>
                      <span>{evaluationResult ? `${evaluationResult.playerOutfitScore}/10` : '-/10'}</span>
                    </div>
                  </div>
                </div>
              </div>
              </GlassPanel>
            </motion.div>
          </div>

          {/* Winner Display */}
          {evaluationResult && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.35 }}
            >
              <GlassPanel variant="card" className="text-center">
              <h3 className="font-bold mb-2 text-2xl">🔥 FINAL SCORE: {evaluationResult.playerScore.toFixed(1)} / 100 🔥</h3>
              <motion.div
                animate={{ scale: [1, 1.04, 1], boxShadow: ['0 0 0 rgba(250,204,21,0)', '0 0 24px rgba(250,204,21,0.45)', '0 0 0 rgba(250,204,21,0)'] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="inline-block px-8 py-4 rounded-xl font-bold text-lg bg-yellow-400 text-black"
              >
                {gradeLabel}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
                {evaluationResult.reasoning}
              </p>
              </GlassPanel>
            </motion.div>
          )}

          {/* Proceed to final results */}
          {evaluationResult && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="text-center"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={proceedToResults}
                className="px-8 py-3 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                View Final Look →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { useGameStore.getState().resetGame(); }}
                className="ml-3 px-8 py-3 bg-foreground/10 text-foreground rounded-lg font-semibold hover:bg-foreground/20 transition-colors"
              >
                🔄 Play Again
              </motion.button>
              <p className="text-xs text-muted-foreground mt-2">
                Go to your final aesthetic presentation screen.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
