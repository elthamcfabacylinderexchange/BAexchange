import React, { useRef } from 'react';
import { Maximize2, Minimize2, RotateCcw, CheckCircle2, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import elthamLogo from '../assets/images/elthamlogo18.png';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  onResetKiosk: () => void;
  onOpenSettings?: () => void;
  depotName: string;
  user: User | null;
  accessToken: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isLoggingIn: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onResetKiosk,
  onOpenSettings,
  user,
  accessToken,
  onGoogleSignIn,
  onGoogleSignOut,
  isLoggingIn,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<any>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  React.useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Mark with Eltham Logo (Triple tap opens settings discretely) */}
        <div
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
          onClick={() => {
            logoClickCount.current += 1;
            if (logoClickCount.current >= 3) {
              logoClickCount.current = 0;
              if (onOpenSettings) onOpenSettings();
            }
            if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
            logoClickTimer.current = setTimeout(() => {
              logoClickCount.current = 0;
            }, 1000);
          }}
        >
          <div className="h-11 w-9 bg-white rounded-md p-0.5 shadow-xs shrink-0 flex items-center justify-center">
            <img
              src={elthamLogo}
              alt="Eltham Fire Brigade CFA"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Eltham Fire Brigade
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                CFA
              </span>
            </div>
            <span className="text-xs text-amber-400 font-semibold block -mt-0.5">
              Eltham CFA BA Cylinder Exchange
            </span>
          </div>
        </div>

        {/* Tablet Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Gmail Login Button or Connected Badge */}
          {user && accessToken ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-600/40 px-3 py-1.5 rounded-xl text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold block text-white text-[11px]">Gmail Connected</span>
                <span className="text-[10px] text-emerald-400 font-mono max-w-[140px] truncate block">
                  {user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={onGoogleSignOut}
                title="Disconnect Gmail Account"
                className="ml-1 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={onGoogleSignIn}
              disabled={isLoggingIn}
              text={isLoggingIn ? 'Connecting...' : user ? 'Reconnect Gmail' : 'Login to Gmail'}
            />
          )}

          {/* Desktop/Tablet App Install Button */}
          <PWAInstallButton />

          <button
            type="button"
            onClick={onResetKiosk}
            title="Reset Form"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Tablet Fullscreen'}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
