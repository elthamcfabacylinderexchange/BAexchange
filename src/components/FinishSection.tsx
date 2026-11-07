import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';

interface FinishSectionProps {
  brigadeName: string;
  droppedOffCount: number;
  collectedCount: number;
  isSubmitting: boolean;
  onFinish: () => void;
}

export const FinishSection: React.FC<FinishSectionProps> = ({
  brigadeName,
  droppedOffCount,
  collectedCount,
  isSubmitting,
  onFinish,
}) => {
  const hasBrigade = Boolean(brigadeName && brigadeName.trim());
  const hasCylinders = droppedOffCount > 0 || collectedCount > 0;
  const canFinish = hasBrigade && hasCylinders && !isSubmitting;

  const handleClick = () => {
    if (!canFinish) return;
    sound.playTap();
    onFinish();
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-center sm:text-left space-y-0.5">
        <div className="text-sm">
          {hasBrigade ? (
            <div>
              <span className="font-bold text-white text-base">
                {brigadeName} ·{' '}
                <span className="text-rose-400">{droppedOffCount} Dropped</span> /{' '}
                <span className="text-emerald-400">{collectedCount} Collected</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Receipt will automatically email upon tapping Finish
              </p>
            </div>
          ) : (
            <span className="text-amber-400 text-xs flex items-center justify-center sm:justify-start gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Select a brigade on the left to proceed
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={!canFinish}
        className={`w-full sm:w-auto min-h-[52px] px-8 rounded-xl font-black text-base tracking-wide shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${
          canFinish
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-emerald-600/30'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Sending Email & Saving...</span>
          </>
        ) : (
          <>
            <span>Finish</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </>
        )}
      </button>
    </div>
  );
};
