import React, { useState, useMemo } from 'react';
import { Search, Check, X, Plus } from 'lucide-react';
import { Brigade } from '../types';
import { POPULAR_CFA_BRIGADES, ALL_CFA_BRIGADES } from '../data/cfaBrigades';
import { sound } from '../utils/sound';

interface BrigadeSelectorProps {
  selectedBrigade: string;
  onSelectBrigade: (name: string, district?: string) => void;
}

export const BrigadeSelector: React.FC<BrigadeSelectorProps> = ({
  selectedBrigade,
  onSelectBrigade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrigades = useMemo(() => {
    if (!searchQuery.trim()) {
      return POPULAR_CFA_BRIGADES;
    }
    const q = searchQuery.toLowerCase().trim();
    return ALL_CFA_BRIGADES.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (b: { name: string; district?: string }) => {
    sound.playTap();
    onSelectBrigade(b.name, b.district);
  };

  const trimmedQuery = searchQuery.trim();
  const hasExactMatch = trimmedQuery && filteredBrigades.some(
    (b) => b.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Title */}
      <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs">
            1
          </span>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
            Select Brigade
          </h2>
        </div>
        {selectedBrigade && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">{selectedBrigade}</span>
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        {/* Search any CFA Brigade in Victoria */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any CFA brigade in Victoria..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600">
            {trimmedQuery ? `Search Results (${filteredBrigades.length})` : 'Favourites (8)'}
          </span>
          {!trimmedQuery && (
            <span className="text-[11px] text-slate-400">
              Type above to search any brigade
            </span>
          )}
        </div>

        {/* Custom typed brigade 1-tap option if not already matched */}
        {trimmedQuery.length >= 2 && !hasExactMatch && (
          <button
            type="button"
            onClick={() => handleSelect({ name: trimmedQuery, district: 'CFA Victoria' })}
            className="p-3 rounded-xl border border-dashed border-red-300 bg-red-50 hover:bg-red-100/80 text-left transition-all flex items-center justify-between gap-2 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Select "{trimmedQuery}"
                </span>
                <span className="text-[11px] text-red-700">
                  Custom / Visiting CFA Brigade
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded-lg">
              Use This
            </span>
          </button>
        )}

        {/* Brigades Grid */}
        <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[380px] p-0.5">
          {filteredBrigades.map((b) => {
            const isSelected = selectedBrigade === b.name;

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelect(b)}
                className={`min-h-[52px] p-3 text-left rounded-xl border transition-all flex flex-col justify-center relative active:scale-[0.98] ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className={`font-bold text-sm leading-tight ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {b.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                </div>
                <span
                  className={`text-[11px] mt-0.5 ${
                    isSelected ? 'text-red-100' : 'text-slate-500'
                  }`}
                >
                  {b.district}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
