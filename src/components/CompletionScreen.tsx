import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ScanBarcode,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  Smartphone,
  AlertCircle,
  Mail,
  RotateCw
} from 'lucide-react';
import { CylinderExchangeRecord } from '../types';
import { sound } from '../utils/sound';
import elthamLogo from '../assets/images/elthamlogo18.png';

interface CompletionScreenProps {
  record: CylinderExchangeRecord;
  autoResetSeconds: number;
  onReset: () => void;
  onViewHtmlPreview?: (id: string) => void;
  onResendEmail?: (id: string) => Promise<boolean>;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  record,
  autoResetSeconds,
  onReset,
  onViewHtmlPreview,
  onResendEmail,
}) => {
  // Give 10 seconds longer for firefighters to read the reminder and scan cylinders before returning
  const initialCountdown = Math.max(autoResetSeconds, 20) + 10;
  const [secondsRemaining, setSecondsRemaining] = useState(initialCountdown);
  const [isPaused, setIsPaused] = useState(false);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  useEffect(() => {
    // Sound confirmation chime
    sound.playSuccess();
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (secondsRemaining <= 0) {
      onReset();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isPaused, onReset]);

  const progressPercentage = Math.max(0, (secondsRemaining / initialCountdown) * 100);

  const handleTriggerResend = async () => {
    if (!onResendEmail || isResending) return;
    setIsResending(true);
    setResendResult(null);
    try {
      const ok = await onResendEmail(record.id);
      if (ok) {
        setResendResult('Email successfully dispatched!');
      } else {
        setResendResult('Could not deliver email. Please reconnect Gmail or check Settings.');
      }
    } catch (err: any) {
      setResendResult(err.message || 'Error resending email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-1 px-2 space-y-3 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Top Header Banner - Compact height */}
        <div className="bg-emerald-600 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/30 shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                Exchange Successfully Logged
              </h2>
              <span className="text-emerald-100 text-[11px] sm:text-xs font-mono">
                Receipt Ref: {record.id} · {record.brigadeName}
              </span>
            </div>
          </div>

          <div className="h-9 w-7.5 bg-white rounded-lg p-0.5 shadow-2xs ring-2 ring-white/40 flex items-center justify-center shrink-0">
            <img
              src={elthamLogo}
              alt="Eltham Fire Brigade"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Central Instruction Reminder Area - Tightened vertical padding & spacing */}
        <div className="p-3.5 sm:p-5 space-y-3">
          {/* Email Status Alert Banner */}
          {record.emailStatus === 'failed' ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900">Automated Email Not Sent</div>
                  <p className="mt-0.5 text-amber-900 leading-snug">
                    {record.emailDeliveryDetail || "Gmail is not connected on this kiosk tablet."}
                  </p>
                  {resendResult && (
                    <p className="mt-1 font-bold text-slate-900 bg-amber-100/90 px-2 py-0.5 rounded text-[11px]">
                      {resendResult}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {onResendEmail && (
                  <button
                    type="button"
                    onClick={handleTriggerResend}
                    disabled={isResending}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Attempting...' : 'Retry Dispatching Email'}</span>
                  </button>
                )}
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(record.recipientEmail)}&su=${encodeURIComponent(`[CFA BA Kiosk] ${record.brigadeName} - Exchange Receipt`)}&body=${encodeURIComponent(`CFA BA Cylinder Exchange Receipt: ${record.id}\nBrigade: ${record.brigadeName}\nDropped Off: ${record.droppedOffCount}\nCollected: ${record.collectedCount}\nTime: ${new Date(record.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-amber-300 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Mail className="w-3 h-3 text-red-600" />
                  <span>Send via Gmail Web</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">
                  Delivered to <strong className="font-mono text-slate-900">{record.recipientEmail}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase ml-2 shrink-0">Sent</span>
            </div>
          )}

          {/* 2-Column Responsive Grid: Side-by-side on tablet/desktop to save vertical height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Collection Reminder Card */}
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50/70 p-3 sm:p-4 shadow-2xs flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md">
                    Action Upon Collection
                  </span>
                  <span className="text-xs font-black text-amber-950 bg-white border border-amber-300 px-2 py-0.5 rounded-lg shadow-2xs">
                    {record.collectedCount} to Scan
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <ScanBarcode className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      Scan each collected cylinder
                    </h3>
                    <p className="text-xs font-semibold text-amber-950 mt-0.5 leading-snug">
                      Transfer into{' '}
                      <span className="underline decoration-amber-600 font-bold text-slate-950">
                        {record.brigadeName}
                      </span>{' '}
                      upon collection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-100/90 border border-amber-300 rounded-lg p-2 text-xs text-amber-950">
                <Smartphone className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="text-[11px] leading-tight">
                  Use the <strong className="font-bold text-slate-950">CFA Swap &amp; Go ServiceNow App</strong> on your phone/tablet.
                </span>
              </div>
            </div>

            {/* Dropped Off Clarification Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-2xs flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                    Drop-Off Guidance
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                    {record.droppedOffCount} Dropped Off
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      No scanning for drop-offs
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      Leave empty cylinders at the Eltham BA cache. No scanning is required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-tight">
                  No ServiceNow action required for dropped-off cylinders.
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Receipt Details Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowReceiptDetails(!showReceiptDetails)}
              className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left text-xs font-bold text-slate-700 cursor-pointer"
            >
              <span>View Exchange Summary &amp; Receipt Details</span>
              {showReceiptDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {showReceiptDetails && (
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block">
                      Dropped Off (Empty)
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-rose-700 tabular-nums">
                      {record.droppedOffCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Collected (Full)
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
                      {record.collectedCount}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden text-xs">
                  <div className="px-3 py-1.5 flex justify-between bg-slate-50 font-mono">
                    <span className="text-slate-500">Receipt Ref:</span>
                    <span className="font-bold text-slate-900">{record.id}</span>
                  </div>
                  <div className="px-3 py-1.5 flex justify-between">
                    <span className="text-slate-500">Brigade:</span>
                    <span className="font-bold text-slate-900">{record.brigadeName}</span>
                  </div>
                  <div className="px-3 py-1.5 flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-800">
                      {new Date(record.timestamp).toLocaleString('en-AU', {
                        timeZone: 'Australia/Melbourne',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-500">Notification:</span>
                    <span className="text-emerald-700 font-bold font-mono text-xs">
                      {record.recipientEmail}
                    </span>
                  </div>
                  {record.emailDeliveryDetail && (
                    <div className="px-3 py-1.5 bg-emerald-50 text-[11px] text-emerald-900 font-medium flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{record.emailDeliveryDetail}</span>
                    </div>
                  )}
                </div>

                {/* 1-Click Send / Preview Shortcuts */}
                <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(record.recipientEmail)}&su=${encodeURIComponent(`[CFA BA Kiosk] ${record.brigadeName} - Exchange Receipt`)}&body=${encodeURIComponent(`CFA BA Cylinder Exchange Receipt: ${record.id}\nBrigade: ${record.brigadeName}\nDropped Off: ${record.droppedOffCount}\nCollected: ${record.collectedCount}\nTime: ${new Date(record.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
                  >
                    <span>Send via Gmail Web</span>
                  </a>
                  {onViewHtmlPreview && (
                    <button
                      type="button"
                      onClick={() => onViewHtmlPreview(record.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors border border-slate-300 cursor-pointer"
                    >
                      View HTML Receipt
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tablet Action: Return to Home Screen Button & Countdown */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={onReset}
              className="w-full min-h-[46px] sm:min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>Return to Home Screen</span>
            </button>

            {/* Countdown / Auto-Reset */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>
                  {isPaused
                    ? 'Timer paused (screen will remain active)'
                    : `Returning to home screen in ${secondsRemaining}s`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  {isPaused ? 'Resume Timer' : 'Pause'}
                </button>
              </div>

              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
