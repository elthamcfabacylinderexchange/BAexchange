import React, { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  CheckCircle,
  X,
  ExternalLink,
  Tablet,
  Apple,
  Terminal,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

type DeviceTab = 'android' | 'windows' | 'ios' | 'linux';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<DeviceTab>('android');

  useEffect(() => {
    if (isAndroid) {
      setActiveTab('android');
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, [isAndroid, isIOS]);

  // If already running inside standalone/kiosk mode, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDownloadWindowsLauncher = () => {
    const appUrl = window.location.href;
    const batContent = `@echo off
title Launch Eltham CFA BA Cylinder Exchange Kiosk
echo ===================================================================
echo Starting Eltham CFA BA Cylinder Exchange Kiosk in Fullscreen Mode...
echo ===================================================================
start msedge --kiosk "${appUrl}" --edge-kiosk-type=fullscreen 2>nul || start chrome --kiosk "${appUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Launch-CFA-BA-Kiosk-Fullscreen.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLinuxLauncher = () => {
    const appUrl = window.location.href;
    const desktopContent = `[Desktop Entry]
Version=1.0
Name=Eltham CFA BA Kiosk
Comment=CFA Breathing Apparatus Cylinder Check-in and Check-out Kiosk
Exec=chromium-browser --kiosk "${appUrl}"
Icon=/app/applet/public/pwa-512x512.png
Terminal=false
Type=Application
Categories=Utility;Kiosk;
`;
    const blob = new Blob([desktopContent], { type: 'application/x-desktop' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Eltham-CFA-BA-Kiosk.desktop';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install Kiosk App / Add to Desktop or Home Screen"
        className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:shadow-red-600/30 active:scale-[0.98]"
      >
        <Monitor className="w-4 h-4 shrink-0" />
        <span className="hidden md:inline">
          {isAndroid ? 'Install on Android' : 'Install Desktop App'}
        </span>
        <span className="md:hidden">Install</span>
      </button>

      {/* Guide & Options Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Install Kiosk App Icon</h3>
                  <p className="text-[11px] text-slate-400">Auto-loads into full screen mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 px-3 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'android'
                    ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Android Tablet / Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('windows')}
                className={`py-2 px-3 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'windows'
                    ? 'bg-white text-red-700 border-t-2 border-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-red-600" />
                <span>Windows PC</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-3 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'ios'
                    ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-slate-800" />
                <span>iPad / iPhone</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('linux')}
                className={`py-2 px-3 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'linux'
                    ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-slate-700" />
                <span>Raspberry Pi</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* TAB 1: ANDROID */}
              {activeTab === 'android' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <span>Android Tablet & Phone Home Screen</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Installing creates an app shortcut on your Android tablet's home screen. Launching from this icon auto-opens the kiosk in <strong>true edge-to-edge fullscreen mode</strong> with zero URL bar.
                    </p>
                  </div>

                  {isInstallable && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await install();
                        if (res) setShowModal(false);
                      }}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tap to Install on Android Now</span>
                    </button>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                      Step-by-Step Instructions for Android:
                    </span>
                    <ol className="list-decimal pl-4 space-y-2 text-slate-700 leading-relaxed">
                      <li>
                        Tap the <strong>three dots (⋮)</strong> in the top-right corner of Google Chrome or Samsung Internet.
                      </li>
                      <li>
                        Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                      </li>
                      <li>
                        Confirm by tapping <strong>"Install"</strong> or <strong>"Add"</strong>.
                      </li>
                      <li>
                        The <strong>Eltham CFA BA Kiosk</strong> icon will now appear on your tablet home screen.
                      </li>
                      <li>
                        Tap the home screen icon anytime to launch straight into <strong>automated fullscreen kiosk mode</strong>.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB 2: WINDOWS */}
              {activeTab === 'windows' && (
                <div className="space-y-3.5">
                  {isInstallable ? (
                    <div className="space-y-3">
                      <p className="text-slate-700 leading-relaxed">
                        Click below to install the <strong>Eltham CFA BA Kiosk</strong> app shortcut to your Windows desktop.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await install();
                          if (res) setShowModal(false);
                        }}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install to Windows Desktop</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                      <strong className="block font-bold text-slate-900">Chrome or Edge:</strong>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Look for the <strong>Install</strong> icon (computer with down arrow) on the right side of the URL bar.</li>
                        <li>Or click browser menu (<strong>⋮</strong>) &rarr; <strong>Save and share</strong> &rarr; <strong>Install Eltham CFA BA Kiosk</strong>.</li>
                        <li>Check <strong>Create Desktop Shortcut</strong>.</li>
                      </ol>
                    </div>
                  )}

                  {/* 1-Click Desktop Launcher Script Download */}
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-red-900">
                      <Download className="w-4 h-4" />
                      <span>Dedicated Kiosk Desktop Shortcut (.bat)</span>
                    </div>
                    <p className="text-red-950 text-[11px] leading-relaxed">
                      Download a 1-click Windows desktop script that launches Edge or Chrome with the <code>--kiosk</code> flag for guaranteed edge-to-edge full screen:
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadWindowsLauncher}
                      className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Windows Launcher (.bat)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: IOS */}
              {activeTab === 'ios' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-900 space-y-2">
                    <strong className="block font-bold text-xs uppercase tracking-wider text-slate-700">
                      Add to iPad / iPhone Home Screen:
                    </strong>
                    <ol className="list-decimal pl-4 space-y-2 text-slate-700 leading-relaxed">
                      <li>Tap the <strong>Share</strong> button (box with upward arrow) in the Safari toolbar.</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                      <li>Tap <strong>Add</strong> in the top-right corner.</li>
                    </ol>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    The Eltham CFA icon will appear on your home screen and open directly in fullscreen kiosk mode without browser tabs or Safari toolbars.
                  </p>
                </div>
              )}

              {/* TAB 4: LINUX / RASPBERRY PI */}
              {activeTab === 'linux' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-900 space-y-2">
                    <strong className="block font-bold text-xs uppercase tracking-wider text-slate-700">
                      Linux / Raspberry Pi Kiosk:
                    </strong>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      For station kiosks running Raspberry Pi OS or Ubuntu touchscreens, download this desktop entry to launch Chromium in locked kiosk mode:
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadLinuxLauncher}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Linux Shortcut (.desktop)</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
