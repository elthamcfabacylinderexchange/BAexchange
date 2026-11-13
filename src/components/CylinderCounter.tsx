import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { sound } from '../utils/sound';

interface CylinderCounterProps {
  droppedOffCount: number;
  collectedCount: number;
  onUpdateCounts: (dropped: number, collected: number) => void;
}

export const CylinderCounter: React.FC<CylinderCounterProps> = ({
  droppedOffCount,
  collectedCount,
  onUpdateCounts,
}) => {
  const handleDropChange = (delta: number) => {
    const next = Math.max(0, droppedOffCount + delta);
    if (delta > 0) sound.playIncrement();
    else sound.playDecrement();
    onUpdateCounts(next, collectedCount);
  };

  const handleCollectChange = (delta: number) => {
    const next = Math.max(0, collectedCount + delta);
    if (delta > 0) sound.playIncrement();
    else sound.playDecrement();
    onUpdateCounts(droppedOffCount, next);
  };

  const handleDropDirect = (val: number) => {
    sound.playTap();
    onUpdateCounts(Math.max(0, val), collectedCount);
  };

  const handleCollectDirect = (val: number) => {
    sound.playTap();
    onUpdateCounts(droppedOffCount, Math.max(0, val));
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Title */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white font-bold text-sm shrink-0">
            2
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            BA Cylinder Counts
          </h2>
        </div>
        <span className="text-sm text-slate-400">
          Touch + / - or quick count
        </span>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* COUNTER 1: DROPPING OFF */}
        <div className="p-4 rounded-xl bg-rose-50/70 border-2 border-rose-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase text-rose-700 tracking-wider">
                Dropping Off
              </span>
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                Empty / Used
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Cylinders you are returning
            </p>
          </div>

          {/* Stepper */}
          <div className="my-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleDropChange(-1)}
              disabled={droppedOffCount === 0}
              className="w-14 h-14 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 active:scale-95 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition-all shadow-xs"
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            <div className="min-w-[80px] text-center">
              <span className="text-6xl font-black text-slate-900 tabular-nums leading-none">
                {droppedOffCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDropChange(1)}
              className="w-14 h-14 rounded-xl bg-rose-600 border border-rose-700 text-white hover:bg-rose-700 active:scale-95 flex items-center justify-center transition-all shadow-xs"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Quick pick */}
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 1, 2, 4, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDropDirect(num)}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg border transition-all ${
                  droppedOffCount === num
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white hover:bg-rose-100 text-slate-700 border-rose-200'
                }`}
              >
                {num === 0 ? '0' : `+${num}`}
              </button>
            ))}
          </div>
        </div>

        {/* COUNTER 2: COLLECTING */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase text-emerald-700 tracking-wider">
                Collecting
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                Full
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Full cylinders you are taking
            </p>
          </div>

          {/* Stepper */}
          <div className="my-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleCollectChange(-1)}
              disabled={collectedCount === 0}
              className="w-14 h-14 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 active:scale-95 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition-all shadow-xs"
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            <div className="min-w-[80px] text-center">
              <span className="text-6xl font-black text-slate-900 tabular-nums leading-none">
                {collectedCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCollectChange(1)}
              className="w-14 h-14 rounded-xl bg-emerald-600 border border-emerald-700 text-white hover:bg-emerald-700 active:scale-95 flex items-center justify-center transition-all shadow-xs"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Quick pick */}
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 1, 2, 4, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleCollectDirect(num)}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg border transition-all ${
                  collectedCount === num
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-emerald-100 text-slate-700 border-emerald-200'
                }`}
              >
                {num === 0 ? '0' : `+${num}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
