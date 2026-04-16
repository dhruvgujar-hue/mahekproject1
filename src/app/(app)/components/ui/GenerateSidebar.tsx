"use client";
import { useMemo } from 'react';
import { GlassPanel } from '@/components/GlassPanel';
import { GlassButton } from '@/components/GlassButton';
import type { WardrobeItem } from '@/types';
import { useGameStore } from '@/lib/state/gameStore';
import { MAX_WARDROBE_ITEMS } from '@/lib/constants';

// Pre-defined clothing items from the CLOTHING folder
const CLOTHING_ITEMS: WardrobeItem[] = [
  { id: 'clothing-top1', name: 'Top', imageUrl: '/CLOTHING/Top-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'top' },
  { id: 'clothing-top2', name: 'Top 2', imageUrl: '/CLOTHING/Top2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'top' },
  { id: 'clothing-bottom1', name: 'Bottom 1', imageUrl: '/CLOTHING/Bottom1-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-bottom2', name: 'Bottom 2', imageUrl: '/CLOTHING/Bottom2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-bottom3', name: 'Bottom 3', imageUrl: '/CLOTHING/Bottom3-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-dress1', name: 'Dress', imageUrl: '/CLOTHING/Dress-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'dress' },
  { id: 'clothing-dress2', name: 'Dress 2', imageUrl: '/CLOTHING/Dress2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'dress' },
  { id: 'clothing-shoes1', name: 'Shoes', imageUrl: '/CLOTHING/Shoes-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-shoes2', name: 'Shoes 2', imageUrl: '/CLOTHING/Shoes2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-bag1', name: 'Bag', imageUrl: '/CLOTHING/Bag-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'top' },
  { id: 'clothing-bag2', name: 'Bag 2', imageUrl: '/CLOTHING/Bag1-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'top' },
];

interface GenerateSidebarProps {
  className?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function GenerateSidebar({ className = '', showToast }: GenerateSidebarProps) {
  const addToWardrobe = useGameStore((s) => s.addToWardrobe);
  const removeFromWardrobe = useGameStore((s) => s.removeFromWardrobe);
  const setPhase = useGameStore((s) => s.setPhase);
  const wardrobe = useGameStore((s) => s.wardrobe);
  const phase = useGameStore((s) => s.phase);

  const wardrobeIds = useMemo(() => new Set(wardrobe.map((w) => w.id)), [wardrobe]);

  const toggleClothing = (item: WardrobeItem) => {
    if (phase !== 'ShoppingSpree') {
      showToast?.('Shopping is unavailable now', 'info');
      return;
    }
    const inWardrobe = wardrobeIds.has(item.id);
    if (inWardrobe) {
      removeFromWardrobe(item.id);
      showToast?.('Removed from wardrobe.', 'info');
    } else {
      if (wardrobe.length >= MAX_WARDROBE_ITEMS) {
        showToast?.(`Max ${MAX_WARDROBE_ITEMS} items allowed. Remove something first.`, 'info');
        return;
      }
      addToWardrobe(item);
      showToast?.('Added to wardrobe! 👗', 'success');
    }
  };

  return (
    <GlassPanel className={`relative isolate h-full flex flex-col overflow-hidden border border-[#8A4A8A]/45 bg-[#1D152B]/92 shadow-[0_12px_40px_rgba(15,10,30,0.45)] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(215,143,236,0.25),transparent_44%),radial-gradient(circle_at_90%_100%,rgba(138,94,212,0.22),transparent_50%),linear-gradient(180deg,#2A1E42_0%,#211735_45%,#1A142A_100%)]" />

      {/* Header */}
      <div className="relative mb-3 rounded-2xl border border-[#D48CCB]/45 bg-[#2E2240]/62 px-3 py-3 backdrop-blur-sm">
        <div className="text-[10px] tracking-[0.22em] uppercase text-[#F1CBE8]">ELIE SAAB Atelier</div>
        <h3 className="text-base font-extrabold text-[#F8E9FF] mt-1 tracking-[0.03em]">PICK YOUR CLOTHES</h3>
        <p className="text-xs text-[#EBDCF6]/85 mt-1 leading-relaxed">Select pieces below to add them to your styling wardrobe.</p>
      </div>

      {/* Category legend */}
      <div className="relative mb-3 rounded-2xl border border-[#D989C6]/35 bg-[#1F1530]/65 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#F1CBE8]">Collection</p>
          <span className="rounded-full border border-[#D989C6]/45 bg-[#3B2755]/75 px-2 py-0.5 text-[10px] font-semibold text-[#F7E5FF]">{wardrobe.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-[#EBDCF6]/90">
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">tops</span>
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">bottoms</span>
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">dresses</span>
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">shoes</span>
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">bags</span>
        </div>
        {phase === 'ShoppingSpree' && wardrobe.length > 0 && (
          <GlassButton
            variant="primary"
            className="w-full mt-3 border-0 text-white bg-gradient-to-r from-[#C44086] via-[#A64CB2] to-[#6A56D8] hover:opacity-95"
            onClick={() => {
              setPhase('StylingRound');
              showToast?.('Moving to Styling Round', 'success');
            }}
          >
            Continue to Styling Round →
          </GlassButton>
        )}
      </div>

      {/* Clothing items grid */}
      <div className="relative flex-1 min-h-0 max-h-full overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          {CLOTHING_ITEMS.map((item) => {
            const isSelected = wardrobeIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#3B2755]/90 border-2 border-[#D18BE5] shadow-[0_0_16px_rgba(209,139,229,0.35)] scale-[0.97]'
                    : 'bg-[#2A1D3D]/75 border border-[#B983C8]/35 hover:border-[#E1A0D8]/65 hover:shadow-[0_6px_20px_rgba(180,100,200,0.2)]'
                }`}
                onClick={() => toggleClothing(item)}
                draggable={phase === 'ShoppingSpree'}
                onDragStart={(e) => {
                  try { e.dataTransfer.setData('application/json', JSON.stringify(item)); } catch {}
                }}
              >
                <div className="relative aspect-square overflow-hidden bg-[#251A36]">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                  {/* Selected overlay checkmark */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#C44086] flex items-center justify-center shadow-lg">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {/* Hover label */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-[10px] text-white font-medium truncate">{item.name}</p>
                    <p className="text-[9px] text-white/70">{isSelected ? 'Click to remove' : 'Click to add'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}

