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
} from 'lucide-react';
import { AppSettings, CylinderExchangeRecord } from '../types';
import { sound } from '../utils/sound';
import elthamLogo from '../assets/images/elthamlogo18.png';
import { sendEmailViaGmailApiDirect, sendEmailViaWebhook } from '../services/kioskClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  accessToken?: string | null;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  accessToken,
  onSave,
}) => {
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
  const [showScriptGuide, setShowScriptGuide] = useState(false);
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
        message: 'Please tap "Login to Gmail" in the top bar, enter a Google Script Webhook URL, or enter your 16-character Google App Password below.',
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
          message: detailMsg || 'Failed to dispatch test email. Please check your connection or Gmail settings.',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-12 rounded-lg bg-white p-0.5 ring-2 ring-red-500/50 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={elthamLogo}
                alt="Eltham Fire Brigade"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kiosk & Email Dispatch Settings</h3>
              <p className="text-xs text-slate-400">Configure logistics email & tablet behavior</p>
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

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Email Configuration (Send & Receive to same address) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recipient & Sender Email (Both To & From)
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                When someone submits the form, notifications are automatically sent and received
                both <strong>to</strong> and <strong>from</strong> this email address without requiring any button clicks from firefighters.
              </p>
            </div>

            {/* Test Email Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isTestingEmail ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                    <span>Dispatching test email...</span>
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

            {/* 24/7 Zero-Timeout Kiosk Relay (Permanent Connection) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>24/7 Zero-Timeout Kiosk Relay (Recommended for Tablets)</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    googleScriptWebhookUrl
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {googleScriptWebhookUrl ? 'Relay Active (Never Times Out)' : 'Optional'}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>How to make sure the connection never times out:</strong> Standard Google
                  logins expire after 60 minutes. A <strong>Google Apps Script Webhook</strong> runs
                  directly in your Google account and <strong>never times out</strong>.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Google Apps Script Webhook URL:
                  </label>
                  <input
                    type="url"
                    value={googleScriptWebhookUrl}
                    onChange={(e) => setGoogleScriptWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Collapsible Step-by-Step Setup Guide */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowScriptGuide(!showScriptGuide)}
                    className="flex items-center justify-between w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Click here to view 2-minute setup guide & code</span>
                    {showScriptGuide ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showScriptGuide && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-700">
                      <p className="font-semibold text-slate-800">
                        1. Open Google Apps Script:
                      </p>
                      <a
                        href="https://script.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold underline"
                      >
                        script.new ↗ (signed in as elthamcfabacylinderexchange@gmail.com)
                      </a>

                      <p className="font-semibold text-slate-800 pt-1">
                        2. Replace all script code with this snippet:
                      </p>
                      <div className="relative">
                        <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  GmailApp.sendEmail(data.to, data.subject, "", {
    htmlBody: data.html,
    name: "CFA BA Cylinder Exchange Kiosk"
  });
  return ContentService.createTextOutput(JSON.stringify({ result: "sent" }))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  GmailApp.sendEmail(data.to, data.subject, "", {
    htmlBody: data.html,
    name: "CFA BA Cylinder Exchange Kiosk"
  });
  return ContentService.createTextOutput(JSON.stringify({ result: "sent" }))
    .setMimeType(ContentService.MimeType.JSON);
}`);
                            setScriptCopied(true);
                            setTimeout(() => setScriptCopied(false), 2000);
                          }}
                          className="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {scriptCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{scriptCopied ? 'Copied!' : 'Copy Script'}</span>
                        </button>
                      </div>

                      <p className="font-semibold text-slate-800 pt-1">
                        3. Deploy as a Web App:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        <li>Click <strong>Deploy</strong> &rarr; <strong>New deployment</strong></li>
                        <li>Click the gear icon &rarr; select <strong>Web app</strong></li>
                        <li>Execute as: <strong>Me (elthamcfabacylinderexchange@gmail.com)</strong></li>
                        <li>Who has access: <strong>Anyone</strong></li>
                        <li>Click <strong>Deploy</strong> and copy the <strong>Web app URL</strong></li>
                      </ul>
                      <p className="text-[10px] text-slate-500 pt-1">
                        Once pasted above, this kiosk will deliver receipts forever with 0 timeouts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Google Account App Password */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Alternative: Google Account App Password</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    smtpPass ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {smtpPass ? 'Configured' : 'Optional'}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Generate 16-letter App Password:</span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 font-bold underline"
                  >
                    myaccount.google.com/apppasswords ↗
                  </a>
                </div>
                <div>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="e.g. abcd efgh ijkl mnop"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Depot Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Station / Depot Description
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={depotStationName}
                onChange={(e) => setDepotStationName(e.target.value)}
                placeholder="Eltham Fire Brigade & District BA Depot"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
              />
            </div>
          </div>

          {/* Sound & Haptic Toggle */}
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
              >
                <option value={5}>5 seconds (Fast turnover)</option>
                <option value={8}>8 seconds</option>
                <option value={10}>10 seconds (Standard)</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds (Longer review)</option>
              </select>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
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
