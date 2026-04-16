"use client";
import { useEffect, useMemo, useState } from 'react';
import { GlassPanel } from '@/components/GlassPanel';
import { GlassButton } from '@/components/GlassButton';
import { searchAmazon } from '@/lib/adapters/amazon';
import type { WardrobeItem } from '@/types';
import { useGameStore } from '@/lib/state/gameStore';
import { MAX_WARDROBE_ITEMS } from '@/lib/constants';

interface GenerateSidebarProps {
  className?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function GenerateSidebar({ className = '', showToast }: GenerateSidebarProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WardrobeItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const addToWardrobe = useGameStore((s) => s.addToWardrobe);
  const removeFromWardrobe = useGameStore((s) => s.removeFromWardrobe);
  const setPhase = useGameStore((s) => s.setPhase);
  const wardrobe = useGameStore((s) => s.wardrobe);
  const phase = useGameStore((s) => s.phase);

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read uploaded file'));
      reader.readAsDataURL(file);
    });
  }

  function inferCategoryFromName(name: string): WardrobeItem['category'] {
    const n = name.toLowerCase();
    if (/(dress|gown|jumpsuit)/i.test(n)) return 'dress';
    if (/(pants|jeans|trouser|shorts|skirt)/i.test(n)) return 'bottom';
    return 'top';
  }

  async function onUploadClothing(files: File[]) {
    if (phase !== 'ShoppingSpree') {
      showToast?.('Shopping is unavailable now', 'info');
      return;
    }
    if (!files.length) return;
    const slotsLeft = Math.max(0, MAX_WARDROBE_ITEMS - wardrobe.length);
    if (slotsLeft === 0) {
      showToast?.(`You can only add up to ${MAX_WARDROBE_ITEMS} items. Remove something to add more.`, 'info');
      return;
    }

    const accepted = files.filter((f) => f.type.startsWith('image/')).slice(0, slotsLeft);
    if (accepted.length === 0) {
      showToast?.('Please upload image files', 'error');
      return;
    }

    for (const file of accepted) {
      const imageUrl = await fileToDataUrl(file);
      const item: WardrobeItem = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded item',
        imageUrl,
        buyLink: '',
        price: null,
        source: 'upload',
        category: inferCategoryFromName(file.name),
      };
      addToWardrobe(item);
    }

    showToast?.(`Added ${accepted.length} uploaded item${accepted.length > 1 ? 's' : ''} to wardrobe`, 'success');
    if (accepted.length < files.length) {
      showToast?.(`Only ${accepted.length} item${accepted.length > 1 ? 's' : ''} added due to file type/slot limit`, 'info');
    }
  }

  // Responsive items per page based on viewport height; grid is fixed to 2 columns
  useEffect(() => {
    const calc = () => {
      const h = typeof window !== 'undefined' ? window.innerHeight : 900;
      // rows tuned to roughly fill the card minus header/form/pagination
      if (h < 700) return 10;      // 5 rows * 2 cols
      if (h < 850) return 12;      // 6 rows * 2 cols
      if (h < 1000) return 14;     // 7 rows * 2 cols
      return 16;                   // 8 rows * 2 cols
    };
    const apply = () => setItemsPerPage(calc());
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  const paginatedResults = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return results.slice(start, end);
  }, [results, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(results.length / itemsPerPage);

  useEffect(() => { setCurrentPage(0); }, [results.length]);
  useEffect(() => { setCurrentPage(0); }, [itemsPerPage]);

  const toggleWardrobe = async (item: WardrobeItem) => {
    if (phase !== 'ShoppingSpree') {
      showToast?.('Shopping is unavailable now', 'info');
      return;
    }
    const inWardrobe = wardrobe.some((w) => w.id === item.id);
    if (inWardrobe) {
      removeFromWardrobe(item.id);
      showToast?.('Removed item from wardrobe.', 'info');
    } else {
      if (wardrobe.length >= MAX_WARDROBE_ITEMS) {
        showToast?.(`You can only add up to ${MAX_WARDROBE_ITEMS} items. Remove something to add more.`, 'info');
        return;
      }
      addToWardrobe(item);
      showToast?.('Added item to wardrobe. 👗', 'success');
    }
  };

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== 'ShoppingSpree') {
      showToast?.('Shopping is disabled during this round', 'info');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await searchAmazon(query);
      setResults(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel className={`relative isolate h-full flex flex-col overflow-hidden border border-[#8A4A8A]/45 bg-[#1D152B]/92 shadow-[0_12px_40px_rgba(15,10,30,0.45)] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(215,143,236,0.25),transparent_44%),radial-gradient(circle_at_90%_100%,rgba(138,94,212,0.22),transparent_50%),linear-gradient(180deg,#2A1E42_0%,#211735_45%,#1A142A_100%)]" />

      <div className="relative mb-3 rounded-2xl border border-[#D48CCB]/45 bg-[#2E2240]/62 px-3 py-3 backdrop-blur-sm">
        <div className="text-[10px] tracking-[0.22em] uppercase text-[#F1CBE8]">ELIE SAAB Atelier</div>
        <h3 className="text-base font-extrabold text-[#F8E9FF] mt-1 tracking-[0.03em]">COUTURE FASHION ROOM</h3>
        <p className="text-xs text-[#EBDCF6]/85 mt-1 leading-relaxed">Curate your ELIE SAAB inspired look from your own wardrobe drops.</p>
      </div>

      <div className="relative mb-3 rounded-2xl border border-[#D989C6]/35 bg-[#1F1530]/65 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#F1CBE8]">AI Upload Studio</p>
          <span className="rounded-full border border-[#D989C6]/45 bg-[#3B2755]/75 px-2 py-0.5 text-[10px] font-semibold text-[#F7E5FF]">Smart Sort</span>
        </div>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) void onUploadClothing(files);
              e.currentTarget.value = '';
            }}
            disabled={phase !== 'ShoppingSpree'}
          />
          <span className="inline-flex w-full items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-[#E0A8DC]/70 bg-gradient-to-r from-[#54306F]/86 to-[#3B2A5E]/88 text-[#F9EDFF] cursor-pointer hover:brightness-110 transition-all shadow-[0_8px_25px_rgba(25,10,45,0.35)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload outfit pieces
          </span>
        </label>
        <p className="mt-1.5 text-xs text-[#E8D8F3]/85">Drop or select multiple images. AI-ready tags are inferred so you can style faster.</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-[#EBDCF6]/90">
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">tops</span>
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">bottoms</span>
          <span className="rounded-full border border-[#BD8FD8]/40 bg-[#3A2951]/75 px-2 py-0.5">dresses</span>
        </div>
        {phase === 'ShoppingSpree' && wardrobe.length > 0 && (
          <GlassButton
            variant="primary"
            className="w-full mt-2 border-0 text-white bg-gradient-to-r from-[#C44086] via-[#A64CB2] to-[#6A56D8] hover:opacity-95"
            onClick={() => {
              setPhase('StylingRound');
              showToast?.('Moving to Styling Round', 'success');
            }}
          >
            Continue to Styling Round
          </GlassButton>
        )}
      </div>

      <form onSubmit={onSearch} className="relative mb-3">
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#EBCDF5]">AI Search</p>
        <div className="relative">
          <input
            className="w-full px-3 py-2.5 bg-[#2A1E3C]/70 border border-[#C07BC6]/45 rounded-xl text-[#F7EDFF] placeholder:text-[#C6AEDB]/85 focus:outline-none focus:ring-2 focus:ring-[#D18BE5]/45 focus:border-transparent transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search style pieces (optional)"
            suppressHydrationWarning
            disabled={phase !== 'ShoppingSpree'}
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D7BDE7]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <GlassButton
          type="submit"
          variant="primary"
          disabled={loading || phase !== 'ShoppingSpree'}
          className="w-full mt-3 border-0 bg-black text-white hover:bg-black/90"
        >
          {loading ? 'Searching…' : 'Generate'}
        </GlassButton>
      </form>

      {error && (
        <div className="p-2 rounded-lg bg-[#3E1F3A]/65 border border-[#B96FAF]/45 text-[#FFD9F0] text-xs mb-2">
          {error}
        </div>
      )}

      <div className="relative flex-1 min-h-0 max-h-full overflow-y-auto pr-1">
        {results.length === 0 && !loading && !error && (
          <div className="mb-3 rounded-xl border border-[#B67FC8]/30 bg-[#2A1D3D]/62 p-3 text-xs text-[#E7D7F4]/85">
            Start by uploading your own pieces, then optionally search and add more.
          </div>
        )}
        {results.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 py-2">
            <GlassButton size="sm" variant="ghost" onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>Prev</GlassButton>
            <span className="text-xs text-[#E8D8F3]/90">{currentPage + 1} / {totalPages}</span>
            <GlassButton size="sm" variant="ghost" onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1}>Next</GlassButton>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {paginatedResults.map((r) => (
            <div
              key={r.id}
              className="group relative rounded-xl overflow-hidden bg-[#2A1D3D]/75 border border-[#B983C8]/35 hover:border-[#E1A0D8]/65 transition-all duration-200"
              draggable={phase === 'ShoppingSpree'}
              onDragStart={(e) => {
                try { e.dataTransfer.setData('application/json', JSON.stringify(r)); } catch {}
              }}
            >
              <div className="relative aspect-square overflow-hidden bg-[#251A36]">
                <img src={r.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50" />
                <img src={r.imageUrl} alt={r.name} className="relative w-full h-full object-contain" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/65 via-black/25 to-transparent flex items-end p-2">
                  <GlassButton
                    variant="secondary"
                    className="w-full bg-white/90 dark:bg-black/55 border border-white/70 dark:border-white/20"
                    onClick={() => { void toggleWardrobe(r); }}
                    disabled={phase !== 'ShoppingSpree'}
                  >
                    {wardrobe.some((w) => w.id === r.id) ? 'Remove from closet' : 'Add to closet'}
                  </GlassButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 py-3">
            <GlassButton size="sm" variant="ghost" onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>Prev</GlassButton>
            <span className="text-xs text-[#E8D8F3]/90">{currentPage + 1} / {totalPages}</span>
            <GlassButton size="sm" variant="ghost" onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1}>Next</GlassButton>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

