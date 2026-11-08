import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { TopNav } from './components/TopNav';
import { BrigadeSelector } from './components/BrigadeSelector';
import { CylinderCounter } from './components/CylinderCounter';
import { FinishSection } from './components/FinishSection';
import { CompletionScreen } from './components/CompletionScreen';
import { SettingsModal } from './components/SettingsModal';
import { EmailReceiptModal } from './components/EmailReceiptModal';
import { AuthErrorModal } from './components/AuthErrorModal';
import { AppSettings, CylinderExchangeRecord } from './types';
import {
  initAuth,
  googleSignIn,
  googleSignInRedirect,
  checkRedirectAuth,
  subscribeToTokenStatus,
  logout,
  setCachedAccessToken,
} from './services/auth';
import { setupAutoFullscreen } from './utils/fullscreen';
import {
  getKioskSettings,
  saveKioskSettings,
  submitKioskExchange,
  resendKioskEmail,
} from './services/kioskClient';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewReceiptId, setPreviewReceiptId] = useState<string | null>(null);

  // Auth & Gmail session state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenRemainingMinutes, setTokenRemainingMinutes] = useState<number>(0);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{ code?: string; message?: string } | null>(null);

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

  // Initialize Firebase Auth listener and token status tracker on mount
  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    const unsubscribeToken = subscribeToTokenStatus((token, remaining) => {
      setAccessToken(token);
      setTokenRemainingMinutes(remaining);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  // Check for redirect result on mount (if user returned from full page redirect)
  useEffect(() => {
    checkRedirectAuth()
      .then((res) => {
        if (res) {
          setUser(res.user);
          setAccessToken(res.accessToken);
          setAuthError(null);
        }
      })
      .catch((err: any) => {
        console.error('Redirect sign-in error:', err);
        setAuthError({
          code: err?.code || 'auth/redirect-failed',
          message: err?.message || 'Authentication failed after redirect',
        });
      });
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setAuthError(null);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setAuthError({
        code: err?.code || 'auth/error',
        message: err?.message || 'Google Sign-In failed to complete',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignInRedirect = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await googleSignInRedirect();
    } catch (err: any) {
      console.error('Google Redirect failed:', err);
      setAuthError({
        code: err?.code || 'auth/error',
        message: err?.message || 'Failed to start redirect flow',
      });
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setAuthError(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Fetch settings on mount (server or localStorage fallback)
  useEffect(() => {
    getKioskSettings().then((data) => {
      if (data) setSettings(data);
    });
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
      const record = await submitKioskExchange(
        {
          brigadeName: selectedBrigade,
          brigadeDistrict: selectedDistrict,
          droppedOffCount,
          collectedCount,
          cylinderType: 'Standard 300 BAR Composite',
          recipientEmail: settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com',
          accessToken: accessToken || undefined,
        },
        settings
      );
      setLatestRecord(record);
    } catch (err: any) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (receiptId: string): Promise<boolean> => {
    if (!latestRecord) return false;
    try {
      let currentToken = accessToken;
      if (!currentToken) {
        try {
          const signinRes = await googleSignIn();
          if (signinRes) {
            setUser(signinRes.user);
            setAccessToken(signinRes.accessToken);
            currentToken = signinRes.accessToken;
          }
        } catch (authErr: any) {
          setAuthError({
            code: authErr?.code || 'auth/error',
            message: authErr?.message || 'Google Sign-In failed to authenticate',
          });
          return false;
        }
      }

      const updated = await resendKioskEmail(latestRecord, settings, currentToken);
      setLatestRecord(updated);
      return updated.emailStatus === 'sent';
    } catch (err) {
      console.error('Failed to resend email:', err);
      return false;
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveKioskSettings(newSettings);
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
        tokenRemainingMinutes={tokenRemainingMinutes}
        is24HourRelayActive={Boolean(settings.googleScriptWebhookUrl?.trim() || settings.smtpPass?.trim())}
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

      {/* Google Auth & Domain Error Modal */}
      <AuthErrorModal
        isOpen={Boolean(authError)}
        error={authError}
        onClose={() => setAuthError(null)}
        onRetry={() => {
          setAuthError(null);
          handleGoogleSignIn();
        }}
        onTryRedirect={() => {
          setAuthError(null);
          handleGoogleSignInRedirect();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
