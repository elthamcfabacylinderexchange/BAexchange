import React, { useState, useMemo } from 'react';
import { Search, Check, X } from 'lucide-react';
import { Brigade } from '../types';
import { POPULAR_CFA_BRIGADES, ALL_CFA_BRIGADES } from '../data/cfaBrigades';
import { sound } from '../utils/sound';

interface BrigadeSelectorProps {
  selectedBrigade: string;
  onSelectBrigade: (name: string, district?: string) => void;
}

function isOrderedSubsequence(query: string, target: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

function getPredictiveScore(brigade: Brigade, rawQuery: string): number {
  const q = rawQuery.toLowerCase().trim();
  const name = brigade.name.toLowerCase();
  const district = brigade.district.toLowerCase();
  const region = brigade.region.toLowerCase();
  const words = name.split(/[\s-]+/);

  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (words.some((w) => w.startsWith(q))) return 2;
  if (name.includes(q)) return 3;

  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = `${name} ${district} ${region}`;
  if (tokens.length > 1 && tokens.every((t) => haystack.includes(t))) return 4;

  if (district.includes(q) || region.includes(q)) return 5;

  const compactQuery = q.replace(/\s+/g, '');
  if (
    compactQuery.length >= 2 &&
    words.some((w) => w.startsWith(compactQuery[0])) &&
    isOrderedSubsequence(compactQuery, name.replace(/[\s-]+/g, ''))
  ) {
    return 6;
  }

  return -1;
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

    return ALL_CFA_BRIGADES.map((brigade) => ({
      brigade,
      score: getPredictiveScore(brigade, searchQuery),
    }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.brigade.name.localeCompare(b.brigade.name);
      })
      .map((item) => item.brigade);
  }, [searchQuery]);

  const handleSelect = (b: { name: string; district?: string }) => {
    sound.playTap();
    onSelectBrigade(b.name, b.district);
  };

  const trimmedQuery = searchQuery.trim();

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Title */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white font-bold text-sm shrink-0">
            1
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Select Your Brigade
          </h2>
        </div>
        {selectedBrigade && (
          <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-4 h-4 shrink-0" />
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
            placeholder="Start typing brigade name..."
            className="w-full pl-9 pr-9 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-bold uppercase tracking-wider text-xs text-slate-600">
            {trimmedQuery ? `Matches (${filteredBrigades.length})` : `Favourites (${POPULAR_CFA_BRIGADES.length})`}
          </span>
          <span className="text-xs text-slate-400">
            {trimmedQuery ? 'Tap your brigade below' : 'Type above to find any brigade'}
          </span>
        </div>

        {/* Brigades Grid */}
        {filteredBrigades.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[380px] p-0.5">
            {filteredBrigades.map((b) => {
              const isSelected = selectedBrigade === b.name;

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelect(b)}
                  className={`min-h-[52px] px-3 py-2.5 text-left rounded-xl border transition-all flex flex-col justify-center relative active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`font-bold text-base leading-tight ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {b.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </div>
                  <span
                    className={`text-xs mt-0.5 leading-tight ${
                      isSelected ? 'text-red-100' : 'text-slate-500'
                    }`}
                  >
                    {b.district}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2.5">
            <p className="text-sm font-semibold text-slate-700">
              No CFA brigade matches &ldquo;{trimmedQuery}&rdquo;
            </p>
            <p className="text-xs text-slate-500">
              Check spelling or clear the search to choose from the brigade list.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
