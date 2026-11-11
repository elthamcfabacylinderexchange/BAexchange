import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Copy, Check, X, ShieldAlert, ArrowRight, RefreshCw, Key } from 'lucide-react';
import { firebaseProjectId } from '../services/auth';

interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: { code?: string; message?: string } | null;
  onRetry: () => void;
  onTryRedirect?: () => void;
  onOpenSettings?: () => void;
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  isOpen,
  onClose,
  error,
  onRetry,
  onTryRedirect,
  onOpenSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen || !error) return null;

  const currentHostname = window.location.hostname;
  const isUnauthorizedDomain =
    error.code === 'auth/unauthorized-domain' ||
    error.message?.includes('authorized-domain') ||
    error.message?.includes('unauthorized domain');
  const isPopupClosedByUser = error.code === 'auth/popup-closed-by-user';
  const isPopupBlocked = error.code === 'auth/popup-blocked';
  const isNotSupported = error.code === 'auth/operation-not-supported-in-this-environment';

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const handleCopyHostname = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-amber-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white leading-tight">
                {isUnauthorizedDomain
                  ? 'Firebase Domain Authorization Required'
                  : isNotSupported
                  ? 'Popups Not Supported on Tablet'
                  : isPopupBlocked
                  ? 'Popup Blocked by Tablet Browser'
                  : isPopupClosedByUser
                  ? 'Login Window Closed or Disappeared'
                  : 'Google Sign-In Issue'}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                {isUnauthorizedDomain
                  ? 'Action needed in Firebase Console to allow logins'
                  : 'Troubleshoot your Google account connection'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1.5 rounded-lg hover:bg-amber-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-sm">
          {/* Main Explanation */}
          {isUnauthorizedDomain ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold mb-1">Why does this happen?</p>
                Google & Firebase Authentication strictly block login popups on newly deployed web
                addresses until the domain is registered under <strong>Authorized Domains</strong> in
                your Firebase project. When an unregistered domain attempts login, Google
                automatically terminates the window immediately.
              </div>

              {/* Step 1: Copy Domain */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Step 1: Your GitHub Pages Domain
                </label>
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 p-2.5 rounded-xl font-mono text-xs text-slate-900 justify-between">
                  <span className="truncate select-all font-semibold">{currentHostname}</span>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Domain</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Open Firebase Console */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Step 2: Add Domain in Firebase Console (30 seconds)
                </label>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>
                    Click the button below to open Firebase Authentication Settings for project{' '}
                    <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-bold">
                      {firebaseProjectId}
                    </code>
                  </li>
                  <li>
                    Scroll down to the <strong>Authorized domains</strong> section
                  </li>
                  <li>
                    Click <strong>Add domain</strong>, paste{' '}
                    <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-bold">
                      {currentHostname}
                    </code>{' '}
                    and click <strong>Save</strong>
                  </li>
                  <li>Return to this page and tap &quot;Try Sign-In Again&quot;</li>
                </ol>

                <a
                  href={firebaseConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Firebase Console Settings ↗</span>
                </a>
              </div>
            </div>
          ) : isNotSupported ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs leading-relaxed">
                <strong>Tablet / Home-Screen Mode Detected:</strong> Popup windows cannot be opened when running as an installed Home-Screen App (PWA) on iPads or tablets.
                <p className="mt-1.5 font-medium text-slate-800">
                  Please tap <strong>Sign In using Full Page Redirect</strong> below, which will navigate directly to Google Sign-In and return to the kiosk automatically.
                </p>
              </div>
              {onTryRedirect && (
                <button
                  type="button"
                  onClick={onTryRedirect}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Sign In using Full Page Redirect (Recommended for Tablets)</span>
                </button>
              )}
            </div>
          ) : isPopupBlocked ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs leading-relaxed">
                Your tablet or browser blocked the Google login popup. Please look at your browser address bar to <strong>Always Allow Popups</strong>, or tap the button below to use full-page redirect.
              </div>
              {onTryRedirect && (
                <button
                  type="button"
                  onClick={onTryRedirect}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Sign In using Full Page Redirect</span>
                </button>
              )}
            </div>
          ) : isPopupClosedByUser ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs leading-relaxed">
                The sign-in window closed before completing authentication.
                {currentHostname.includes('github.io') ? (
                  <p className="mt-2 text-slate-700">
                    If this window disappeared instantly by itself without asking for credentials,
                    the domain <strong className="font-mono">{currentHostname}</strong> must be
                    added to <strong>Authorized Domains</strong> in Firebase (see button below).
                  </p>
                ) : (
                  <p className="mt-1.5 text-slate-700">
                    If the tablet closed the popup automatically, try signing in with <strong>Full Page Redirect</strong> below.
                  </p>
                )}
              </div>
              {onTryRedirect && (
                <button
                  type="button"
                  onClick={onTryRedirect}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Try Full Page Redirect (Tablet Friendly)</span>
                </button>
              )}

              {currentHostname.includes('github.io') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 p-2.5 rounded-xl font-mono text-xs justify-between">
                    <span className="truncate select-all">{currentHostname}</span>
                    <button
                      type="button"
                      onClick={handleCopyHostname}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Domain'}</span>
                    </button>
                  </div>
                  <a
                    href={firebaseConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Check Firebase Authorized Domains ↗</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs leading-relaxed">
              <p className="font-bold mb-1">Error Code: {error.code || 'Unknown'}</p>
              <p>{error.message || 'An error occurred during Google Sign-In.'}</p>
            </div>
          )}

          {/* Quick Alternative: Google App Password */}
          {onOpenSettings && (
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      Alternative: Use Google App Password
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Doesn&apos;t require Firebase domain authorization
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Open Settings
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Technical Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
            >
              {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div>Code: {error.code || 'N/A'}</div>
                <div className="break-all">Message: {error.message || 'N/A'}</div>
                <div>Domain: {currentHostname}</div>
                <div>Project: {firebaseProjectId}</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Dismiss
          </button>

          <div className="flex items-center gap-2">
            {onTryRedirect && (
              <button
                type="button"
                onClick={onTryRedirect}
                title="Sign in using full page redirect instead of popup"
                className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Try Full Page Redirect
              </button>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Sign-In Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
