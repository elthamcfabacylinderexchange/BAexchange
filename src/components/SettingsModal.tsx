import React, { useState } from 'react';
import {
  X,
  Mail,
  Volume2,
  Clock,
  Building,
  Check,
  Send,
  AlertCircle,
  Lock,
  Zap,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, CylinderExchangeRecord } from '../types';
import { sound } from '../utils/sound';
import elthamLogo from '../assets/images/elthamlogo18.png';
import { sendEmailViaGmailApiDirect, sendEmailViaWebhook } from '../services/kioskClient';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  accessToken?: string | null;
  user?: User | null;
  tokenRemainingMinutes?: number;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  isLoggingIn?: boolean;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  accessToken,
  user,
  tokenRemainingMinutes = 0,
  onGoogleSignIn,
  onGoogleSignOut,
  isLoggingIn = false,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'relay' | 'email' | 'station'>('relay');


  const [recipientEmail, setRecipientEmail] = useState(
    settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com'
  );
  const [senderEmail, setSenderEmail] = useState(
    settings.senderEmail || 'elthamcfabacylinderexchange@gmail.com'
  );
  const [depotStationName, setDepotStationName] = useState(settings.depotStationName);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [autoResetSeconds, setAutoResetSeconds] = useState(settings.autoResetSeconds);
  const [smtpPass, setSmtpPass] = useState(settings.smtpPass || '');
  const [googleScriptWebhookUrl, setGoogleScriptWebhookUrl] = useState(
    settings.googleScriptWebhookUrl || ''
  );
  const [showScriptGuide, setShowScriptGuide] = useState(true);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Test email state
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Synchronize state when settings load or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRecipientEmail(settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com');
      setSenderEmail(settings.senderEmail || 'elthamcfabacylinderexchange@gmail.com');
      setDepotStationName(settings.depotStationName);
      setSoundEnabled(settings.soundEnabled);
      setAutoResetSeconds(settings.autoResetSeconds);
      setSmtpPass(settings.smtpPass || '');
      setGoogleScriptWebhookUrl(settings.googleScriptWebhookUrl || '');
      setTestResult(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.setEnabled(soundEnabled);
    onSave({
      ...settings,
      recipientEmail: recipientEmail.trim() || 'elthamcfabacylinderexchange@gmail.com',
      senderEmail: senderEmail.trim() || 'elthamcfabacylinderexchange@gmail.com',
      depotStationName: depotStationName.trim(),
      soundEnabled,
      autoResetSeconds: Number(autoResetSeconds) || 10,
      smtpPass: smtpPass.trim() || settings.smtpPass || '',
      googleScriptWebhookUrl: googleScriptWebhookUrl.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestEmail = async () => {
    const cleanPass = smtpPass.trim().replace(/\s+/g, '');
    const cleanWebhook = googleScriptWebhookUrl.trim();

    if (!cleanWebhook && !cleanPass && !accessToken) {
      setTestResult({
        success: false,
        message: 'Please paste a Google Script Webhook URL, enter your Google App Password, or tap "Login to Gmail" in the top bar.',
      });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);
    try {
      let succeeded = false;
      let detailMsg = '';

      // 1. If Webhook URL is configured, test 24/7 Zero-Timeout Kiosk Relay
      if (cleanWebhook) {
        const dummyRecord: CylinderExchangeRecord = {
          id: `CFA-TEST-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          brigadeName: 'Eltham Fire Brigade (Diagnostic Test)',
          droppedOffCount: 2,
          collectedCount: 2,
          cylinderType: 'Standard 300 BAR Composite',
          recipientEmail: recipientEmail.trim(),
          emailStatus: 'sent',
          emailDeliveryDetail: '',
        };

        const webhookResult = await sendEmailViaWebhook(
          dummyRecord,
          depotStationName,
          recipientEmail.trim(),
          cleanWebhook
        );

        if (webhookResult.success) {
          succeeded = true;
          detailMsg = `Success! Test receipt dispatched via 24/7 Zero-Timeout Relay to ${recipientEmail}. Check your inbox!`;
        } else {
          detailMsg = webhookResult.detail;
        }
      }

      // 2. Try server route if available and not yet succeeded
      if (!succeeded && (cleanPass || accessToken)) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }

          const res = await fetch('/api/send-test-email', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: recipientEmail.trim(),
              smtpPass: cleanPass || undefined,
              accessToken: accessToken || undefined,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.success) {
              succeeded = true;
              detailMsg = `Success! Live email delivered to ${recipientEmail}. Check your inbox!`;
            } else {
              detailMsg = data.error || data.result?.detail || 'Failed to dispatch test email.';
            }
          }
        } catch {
          // Server unreachable or 404 (e.g. GitHub Pages static host)
        }
      }

      // 3. If server route wasn't available (GitHub Pages) and we have accessToken, send directly via Gmail API!
      if (!succeeded && accessToken) {
        const dummyRecord: CylinderExchangeRecord = {
          id: `CFA-TEST-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          brigadeName: 'Eltham Fire Brigade (Diagnostic Test)',
          droppedOffCount: 2,
          collectedCount: 2,
          cylinderType: 'Standard 300 BAR Composite',
          recipientEmail: recipientEmail.trim(),
          emailStatus: 'sent',
          emailDeliveryDetail: '',
        };

        const directResult = await sendEmailViaGmailApiDirect(
          dummyRecord,
          depotStationName,
          recipientEmail.trim(),
          accessToken
        );

        if (directResult.success) {
          succeeded = true;
          detailMsg = `Success! Live email delivered to ${recipientEmail} directly via Gmail API. Check your inbox!`;
        } else {
          detailMsg = directResult.detail;
        }
      }

      if (succeeded) {
        setTestResult({
          success: true,
          message: detailMsg || `Success! Live email delivered to ${recipientEmail}. Check your inbox!`,
        });
        onSave({
          ...settings,
          recipientEmail: recipientEmail.trim(),
          senderEmail: senderEmail.trim(),
          depotStationName: depotStationName.trim(),
          soundEnabled,
          autoResetSeconds: Number(autoResetSeconds) || 10,
          smtpPass: cleanPass || settings.smtpPass || '',
          googleScriptWebhookUrl: cleanWebhook || settings.googleScriptWebhookUrl || '',
        });
      } else {
        setTestResult({
          success: false,
          message: detailMsg || 'Failed to dispatch test email. Please check your connection or Webhook URL.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test email',
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const scriptCode = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  GmailApp.sendEmail(data.to, data.subject, "", {
    htmlBody: data.html,
    name: "CFA BA Cylinder Exchange Kiosk"
  });
  return ContentService.createTextOutput(JSON.stringify({ result: "sent" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-12 rounded-lg bg-white p-0.5 ring-2 ring-red-500/50 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={elthamLogo}
                alt="Eltham Fire Brigade"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Kiosk & Email Settings</h3>
              <p className="text-xs text-slate-400">Configure 24/7 permanent auto-dispatch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 px-4 pt-2 gap-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('relay')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'relay'
                ? 'border-red-600 text-red-600 font-extrabold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>24/7 Auto-Email (Zero-Timeout)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-red-600 text-red-600 font-extrabold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email & Test</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('station')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'station'
                ? 'border-red-600 text-red-600 font-extrabold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Station Options</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: 24/7 Zero-Timeout Kiosk Relay & Gmail Login */}
          {activeTab === 'relay' && (
            <div className="space-y-4">
              {/* Option to Re-login to Gmail */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                      <svg viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Gmail Interactive Login
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user && accessToken
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {user && accessToken ? 'Session Active' : 'Logged Out / Expired'}
                  </span>
                </div>

                {user && accessToken ? (
                  <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono truncate">
                          {user.email || 'elthamcfabacylinderexchange@gmail.com'}
                        </span>
                        {tokenRemainingMinutes > 0 && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              tokenRemainingMinutes <= 15
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tokenRemainingMinutes}m left
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Interactive Google session is active. Google OAuth tokens expire every 60 minutes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onGoogleSignIn && (
                        <button
                          type="button"
                          onClick={onGoogleSignIn}
                          disabled={isLoggingIn}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoggingIn ? 'animate-spin' : ''}`} />
                          <span>{isLoggingIn ? 'Connecting...' : 'Re-login to Gmail'}</span>
                        </button>
                      )}
                      {onGoogleSignOut && (
                        <button
                          type="button"
                          onClick={onGoogleSignOut}
                          title="Sign out of Gmail"
                          className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Direct Gmail Session Disconnected
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Log in as <span className="font-mono font-medium text-slate-700">elthamcfabacylinderexchange@gmail.com</span> to dispatch receipts directly via Gmail.
                      </p>
                    </div>
                    {onGoogleSignIn && (
                      <GoogleSignInButton
                        onClick={onGoogleSignIn}
                        disabled={isLoggingIn}
                        text={isLoggingIn ? 'Connecting...' : 'Re-login to Gmail'}
                        className="shrink-0 shadow-xs"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-950 text-xs leading-relaxed">
                <span className="font-extrabold block text-sm text-amber-900 mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                  Why does Gmail log out after rebooting or after 1 hour?
                </span>
                Google strictly limits interactive browser login sessions to 60 minutes.
                <p className="mt-1.5 font-medium text-slate-800">
                  <strong>Permanent 24/7 Fix:</strong> Setting up the free Google Apps Script Webhook
                  below runs directly inside your Google account. It{' '}
                  <strong>never times out, never expires, and survives every tablet reboot</strong>.
                </p>
              </div>

              {/* Webhook Input Field */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Google Apps Script Webhook URL
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      googleScriptWebhookUrl
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {googleScriptWebhookUrl ? 'Relay Configured (Zero-Timeout)' : 'Recommended'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={googleScriptWebhookUrl}
                    onChange={(e) => setGoogleScriptWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
                  />
                </div>

                {/* Test button right inside the relay tab */}
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isTestingEmail || !googleScriptWebhookUrl}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isTestingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                      <span>Sending test receipt through Webhook...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-red-600" />
                      <span>Test Webhook Dispatch (Sends to {recipientEmail})</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* 2-Minute Step-by-Step Setup Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <span>How to create your Webhook URL in 2 minutes (Step-by-Step)</span>
                  </span>
                  <button type="button" className="text-slate-500 p-1">
                    {showScriptGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showScriptGuide && (
                  <div className="space-y-3 pt-2 text-xs text-slate-700 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">
                        Step 1: Open Google Apps Script
                      </span>
                      <a
                        href="https://script.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open script.new (signed in as elthamcfabacylinderexchange@gmail.com) ↗</span>
                      </a>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-1">
                        Step 2: Replace all code in the script editor with this snippet:
                      </span>
                      <div className="relative">
                        <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                          {scriptCode}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(scriptCode);
                            setScriptCopied(true);
                            setTimeout(() => setScriptCopied(false), 2000);
                          }}
                          className="absolute right-2.5 top-2.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-700"
                        >
                          {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{scriptCopied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-1">
                        Step 3: Deploy as Web App
                      </span>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                        <li>In Apps Script, click the blue <strong>Deploy</strong> button &rarr; <strong>New deployment</strong></li>
                        <li>Click the gear icon next to &quot;Select type&quot; &rarr; select <strong>Web app</strong></li>
                        <li>Set <strong>Execute as</strong>: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">Me (elthamcfabacylinderexchange@gmail.com)</code></li>
                        <li>Set <strong>Who has access</strong>: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">Anyone</code></li>
                        <li>Click <strong>Deploy</strong>, grant permissions, and copy the <strong>Web app URL</strong></li>
                        <li>Paste that URL into the input field above and click <strong>Save Settings</strong></li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Alternative: App Password */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Alternative: 16-Letter Google App Password</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">For Server Mode</span>
                </div>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="e.g. abcd efgh ijkl mnop"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Email Addresses & Test */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Receipt Target & Dispatch Email
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Auto-Dispatched
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => {
                        setRecipientEmail(e.target.value);
                        setSenderEmail(e.target.value);
                      }}
                      placeholder="elthamcfabacylinderexchange@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Every cylinder exchange receipt will automatically be emailed both <strong>to</strong> and <strong>from</strong> this address without requiring firefighters to tap any buttons.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTestingEmail}
                    className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {isTestingEmail ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                        <span>Dispatching live test email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-red-600" />
                        <span>Send Test Email to {recipientEmail}</span>
                      </>
                    )}
                  </button>

                  {testResult && (
                    <div
                      className={`mt-2 p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                        testResult.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Station & Kiosk Options */}
          {activeTab === 'station' && (
            <div className="space-y-4">
              {/* Depot Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Station / Depot Header Description
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={depotStationName}
                    onChange={(e) => setDepotStationName(e.target.value)}
                    placeholder="Eltham Fire Brigade & District BA Depot"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Touch Audio Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">
                      Tablet Touch Sound
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Audio clicks on increment/decrement and finish chime
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              {/* Auto-Reset Countdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Auto-Reset Timer (Seconds)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={autoResetSeconds}
                    onChange={(e) => setAutoResetSeconds(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 shadow-2xs"
                  >
                    <option value={5}>5 seconds (Fast turnover)</option>
                    <option value={8}>8 seconds</option>
                    <option value={10}>10 seconds (Standard)</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds (Longer review)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
