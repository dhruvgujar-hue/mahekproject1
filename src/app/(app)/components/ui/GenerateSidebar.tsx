"use client";
import { useMemo } from 'react';
import type { WardrobeItem } from '@/types';
import { useGameStore } from '@/lib/state/gameStore';
import { MAX_WARDROBE_ITEMS } from '@/lib/constants';

// Pre-defined clothing items from the CLOTHING folder
// Order: Tops → Dresses → Bottoms/Pants → Shoes → Bags
const CLOTHING_ITEMS: WardrobeItem[] = [
  // Tops
  { id: 'clothing-top1', name: 'Top', imageUrl: '/CLOTHING/Top-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'top' },
  { id: 'clothing-top2', name: 'Top 2', imageUrl: '/CLOTHING/Top2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'top' },
  // Dresses
  { id: 'clothing-dress1', name: 'Dress', imageUrl: '/CLOTHING/Dress-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'dress' },
  { id: 'clothing-dress2', name: 'Dress 2', imageUrl: '/CLOTHING/Dress2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'dress' },
  // Bottoms/Pants
  { id: 'clothing-bottom1', name: 'Bottom 1', imageUrl: '/CLOTHING/Bottom1-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-bottom2', name: 'Bottom 2', imageUrl: '/CLOTHING/Bottom2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  { id: 'clothing-bottom3', name: 'Bottom 3', imageUrl: '/CLOTHING/Bottom3-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'bottom' },
  // Shoes
  { id: 'clothing-shoes1', name: 'Shoes', imageUrl: '/CLOTHING/Shoes-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'shoe' },
  { id: 'clothing-shoes2', name: 'Shoes 2', imageUrl: '/CLOTHING/Shoes2-removebg-preview.png', buyLink: '', price: null, source: 'preset', category: 'shoe' },
  { id: 'clothing-shoes3', name: 'Shoes 3', imageUrl: '/CLOTHING/Shoes3.png', buyLink: '', price: null, source: 'preset', category: 'shoe' },
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
    <div className={`relative h-full flex flex-col gap-2 ${className}`}>
      {/* Compact header pill */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#E8B4D4]/50 shadow-sm">
          <span className="text-xs font-bold text-[#9B3E75] tracking-wide">BOUTIQUE</span>
          <span className="text-[10px] text-[#B35E92]/70">✦</span>
          <span className="text-[10px] font-semibold text-[#B35E92]">{wardrobe.length}/{MAX_WARDROBE_ITEMS}</span>
        </div>
        {phase === 'ShoppingSpree' && wardrobe.length > 0 && (
          <button
            className="bg-white/70 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-bold text-[#9B3E75] border border-[#D88CB8]/50 shadow-sm hover:bg-white/90 transition-all active:scale-95"
            onClick={() => {
              setPhase('StylingRound');
              showToast?.('Moving to Styling Round', 'success');
            }}
          >
            Continue →
          </button>
        )}
      </div>

      {/* Scrollable clothing grid - frosted glass cards */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          {CLOTHING_ITEMS.map((item) => {
            const isSelected = wardrobeIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleClothing(item)}
                className={`relative cursor-pointer transition-all duration-200 group ${
                  isSelected ? 'scale-[0.95]' : 'hover:scale-[1.02]'
                }`}
              >
                {/* Glass card */}
                <div className={`relative aspect-[4/5] rounded-2xl overflow-hidden backdrop-blur-md border-2 transition-all duration-200 ${
                  isSelected
                    ? 'bg-white/50 border-[#D4628A] shadow-[0_0_20px_rgba(212,98,138,0.3)]'
                    : 'bg-white/30 border-white/40 group-hover:bg-white/45 group-hover:border-[#E8B4D4]/70 group-hover:shadow-[0_8px_24px_rgba(180,100,160,0.15)]'
                }`}>
                  
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-[#F8C8E0]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Clothing image */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain p-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform duration-200 group-hover:scale-105"
                  />

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#D4628A] flex items-center justify-center shadow-md">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Bottom gradient with "Added" indicator */}
                  {isSelected && (
                    <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#D4628A]/30 to-transparent flex items-end justify-center pb-1">
                      <span className="text-[9px] font-bold text-[#9B3E75] uppercase tracking-wider">Added</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
