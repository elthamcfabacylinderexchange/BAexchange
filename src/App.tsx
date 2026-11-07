import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { TopNav } from './components/TopNav';
import { BrigadeSelector } from './components/BrigadeSelector';
import { CylinderCounter } from './components/CylinderCounter';
import { FinishSection } from './components/FinishSection';
import { CompletionScreen } from './components/CompletionScreen';
import { SettingsModal } from './components/SettingsModal';
import { EmailReceiptModal } from './components/EmailReceiptModal';
import { AppSettings, CylinderExchangeRecord } from './types';
import { initAuth, googleSignIn, logout, setCachedAccessToken } from './services/auth';
import { setupAutoFullscreen } from './utils/fullscreen';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewReceiptId, setPreviewReceiptId] = useState<string | null>(null);

  // Auth & Gmail session state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    recipientEmail: 'elthamcfabacylinderexchange@gmail.com',
    senderEmail: 'elthamcfabacylinderexchange@gmail.com',
    depotStationName: 'Eltham Fire Brigade BA Maintenance Cache',
    soundEnabled: true,
    autoResetSeconds: 8,
    requireMemberDetails: false,
    smtpPass: '',
  });

  // Kiosk State - No default brigade selected to force user selection
  const [selectedBrigade, setSelectedBrigade] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [droppedOffCount, setDroppedOffCount] = useState<number>(0);
  const [collectedCount, setCollectedCount] = useState<number>(0);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [latestRecord, setLatestRecord] = useState<CylinderExchangeRecord | null>(null);

  // Force Fullscreen mode automatically as soon as the app launches or on first tap
  useEffect(() => {
    const cleanup = setupAutoFullscreen();
    return () => cleanup();
  }, []);

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setAccessToken(token);
          setCachedAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setCachedAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Fetch settings from server on mount
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            recipientEmail: data.recipientEmail || 'elthamcfabacylinderexchange@gmail.com',
            senderEmail: data.senderEmail || 'elthamcfabacylinderexchange@gmail.com',
            smtpPass: data.smtpPass || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Reset to initial clean state with no default brigade
  const handleResetKiosk = useCallback(() => {
    setSelectedBrigade('');
    setSelectedDistrict('');
    setDroppedOffCount(0);
    setCollectedCount(0);
    setLatestRecord(null);
  }, []);

  // Submit exchange directly and trigger automated email notification
  const handleFinishExchange = async () => {
    if (!selectedBrigade) return;
    if (droppedOffCount === 0 && collectedCount === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        brigadeName: selectedBrigade,
        brigadeDistrict: selectedDistrict,
        droppedOffCount,
        collectedCount,
        cylinderType: 'Standard 300 BAR Composite',
        recipientEmail: settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com',
        accessToken: accessToken || undefined,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save exchange');
      }

      const data = await res.json();
      if (data && data.record) {
        setLatestRecord(data.record);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      // Fallback local record with accurate status
      const offlineRecord: CylinderExchangeRecord = {
        id: `CFA-BA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        brigadeName: selectedBrigade,
        brigadeDistrict: selectedDistrict,
        droppedOffCount,
        collectedCount,
        cylinderType: 'Standard 300 BAR Composite',
        recipientEmail: settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com',
        emailStatus: 'failed',
        emailDeliveryDetail: `Kiosk saved record locally, but network dispatch failed: ${err.message || 'Server unreachable'}.`,
      };
      setLatestRecord(offlineRecord);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (receiptId: string): Promise<boolean> => {
    try {
      let currentToken = accessToken;
      if (!currentToken) {
        const signinRes = await googleSignIn();
        if (signinRes) {
          setUser(signinRes.user);
          setAccessToken(signinRes.accessToken);
          currentToken = signinRes.accessToken;
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch(`/api/exchanges/${receiptId}/resend-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ accessToken: currentToken || undefined }),
      });

      const data = await res.json();
      if (data.success && data.record) {
        setLatestRecord(data.record);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to resend email:', err);
      return false;
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Top Bar with Eltham Fire Brigade logo & Gmail Login */}
      <TopNav
        onResetKiosk={handleResetKiosk}
        onOpenSettings={() => setIsSettingsOpen(true)}
        depotName={settings.depotStationName}
        user={user}
        accessToken={accessToken}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Tablet Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-center">
        {latestRecord ? (
          /* Completion Screen */
          <CompletionScreen
            record={latestRecord}
            autoResetSeconds={settings.autoResetSeconds}
            onReset={handleResetKiosk}
            onViewHtmlPreview={(id) => setPreviewReceiptId(id)}
            onResendEmail={handleResendEmail}
          />
        ) : (
          /* Streamlined 2-Column Tablet Screen (No scroll required) */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Left Column: Brigade Selector */}
            <div className="md:col-span-5 h-full">
              <BrigadeSelector
                selectedBrigade={selectedBrigade}
                onSelectBrigade={(name, district) => {
                  setSelectedBrigade(name);
                  if (district) setSelectedDistrict(district);
                }}
              />
            </div>

            {/* Right Column: Cylinder Counts + Finish Button */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <CylinderCounter
                droppedOffCount={droppedOffCount}
                collectedCount={collectedCount}
                onUpdateCounts={(dropped, collected) => {
                  setDroppedOffCount(dropped);
                  setCollectedCount(collected);
                }}
              />

              <FinishSection
                brigadeName={selectedBrigade}
                droppedOffCount={droppedOffCount}
                collectedCount={collectedCount}
                isSubmitting={isSubmitting}
                onFinish={handleFinishExchange}
              />
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        accessToken={accessToken}
        onSave={handleSaveSettings}
      />

      {/* Email Receipt Preview Modal */}
      <EmailReceiptModal
        receiptId={previewReceiptId}
        onClose={() => setPreviewReceiptId(null)}
      />
    </div>
  );
}
