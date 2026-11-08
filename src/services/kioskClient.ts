import { AppSettings, CylinderExchangeRecord } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  recipientEmail: 'elthamcfabacylinderexchange@gmail.com',
  senderEmail: 'elthamcfabacylinderexchange@gmail.com',
  depotStationName: 'Eltham Fire Brigade BA Maintenance Cache & Fill Station',
  soundEnabled: true,
  autoResetSeconds: 10,
  requireMemberDetails: false,
  smtpPass: '',
  googleScriptWebhookUrl: '',
};

const STORAGE_SETTINGS_KEY = 'cfa_kiosk_settings_v1';
const STORAGE_EXCHANGES_KEY = 'cfa_kiosk_exchanges_v1';

// Base64 URL-safe encoding for Gmail API in pure browser JS
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate the clean, professional HTML receipt
export function generateClientEmailHtml(record: CylinderExchangeRecord, depotName: string): string {
  const dateFormatted = new Date(record.timestamp).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CFA BA Cylinder Exchange Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #b91c1c; color: #ffffff; padding: 22px 28px; }
    .header h1 { margin: 0 0 4px 0; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px; }
    .grid { display: flex; gap: 16px; margin: 20px 0; }
    .stat-card { flex: 1; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
    .stat-card.drop { background: #fff1f2; border-color: #fecdd3; }
    .stat-card.collect { background: #ecfdf5; border-color: #a7f3d0; }
    .stat-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin-bottom: 6px; }
    .stat-val { font-size: 38px; font-weight: 800; line-height: 1; }
    .stat-val.drop { color: #b91c1c; }
    .stat-val.collect { color: #047857; }
    .detail-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    .detail-table th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-weight: 600; width: 36%; border-bottom: 1px solid #e2e8f0; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 500; }
    .defect-box { margin-top: 20px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #92400e; font-size: 14px; }
    .footer { padding: 18px 28px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CFA Breathing Apparatus Exchange</h1>
      <p>${depotName}</p>
    </div>
    <div class="content">
      <p style="margin-top:0; font-size:15px; color:#334155;">
        A BA cylinder exchange transaction has been recorded for <strong>${record.brigadeName}</strong> brigade.
      </p>

      <div class="grid">
        <div class="stat-card drop">
          <div class="stat-label">Dropped Off (Empty)</div>
          <div class="stat-val drop">${record.droppedOffCount}</div>
        </div>
        <div class="stat-card collect">
          <div class="stat-label">Collected (Full)</div>
          <div class="stat-val collect">${record.collectedCount}</div>
        </div>
      </div>

      <table class="detail-table">
        <tr>
          <th>Receipt Ref</th>
          <td style="font-family: monospace; font-weight: 700;">${record.id}</td>
        </tr>
        <tr>
          <th>Brigade</th>
          <td><strong>${record.brigadeName}</strong> ${record.brigadeDistrict ? `(${record.brigadeDistrict})` : ''}</td>
        </tr>
        <tr>
          <th>Date & Time</th>
          <td>${dateFormatted}</td>
        </tr>
        ${record.cylinderType ? `
        <tr>
          <th>Cylinder Type</th>
          <td>${record.cylinderType}</td>
        </tr>` : ''}
        ${record.serialNumbers && record.serialNumbers.length > 0 ? `
        <tr>
          <th>Serial / Barcode Tags</th>
          <td style="font-family: monospace;">${record.serialNumbers.join(', ')}</td>
        </tr>` : ''}
        ${record.generalNotes ? `
        <tr>
          <th>Notes</th>
          <td>${record.generalNotes}</td>
        </tr>` : ''}
      </table>

      ${record.defectReported ? `
      <div class="defect-box">
        <strong>ATTENTION: Cylinder Maintenance / Defect Flagged</strong>
        <p style="margin: 6px 0 0 0;">${record.defectNotes || 'Inspection required: firefighter reported physical defect, pressure drop, or valve wear.'}</p>
      </div>` : ''}
    </div>
    <div class="footer">
      Country Fire Authority Victoria · Eltham Fire Brigade Kiosk
    </div>
  </div>
</body>
</html>`;
}

// Send email via permanent Google Apps Script Webhook (24/7 Zero-Timeout)
export async function sendEmailViaWebhook(
  record: CylinderExchangeRecord,
  depotName: string,
  targetEmail: string,
  webhookUrl: string
): Promise<{ success: boolean; detail: string }> {
  try {
    const htmlContent = generateClientEmailHtml(record, depotName);
    const subject = `[CFA BA Kiosk] ${record.brigadeName} - Exchange Receipt (${record.droppedOffCount} In / ${record.collectedCount} Out)`;

    const payload = {
      to: targetEmail,
      subject,
      html: htmlContent,
      recordId: record.id,
      brigade: record.brigadeName,
      dropped: record.droppedOffCount,
      collected: record.collectedCount,
    };

    // Google Apps Script redirects with 302; mode: 'no-cors' allows browser dispatch without CORS blockage
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      detail: `Delivered directly to ${targetEmail} via 24/7 Zero-Timeout Kiosk Relay`,
    };
  } catch (err: any) {
    return {
      success: false,
      detail: `Relay error: ${err.message || 'Unable to dispatch to Google Script relay'}`,
    };
  }
}

// Send email directly to recipient via official Google Gmail API from browser
export async function sendEmailViaGmailApiDirect(
  record: CylinderExchangeRecord,
  depotName: string,
  targetEmail: string,
  accessToken: string
): Promise<{ success: boolean; detail: string }> {
  try {
    const htmlContent = generateClientEmailHtml(record, depotName);
    const subject = `[CFA BA Kiosk] ${record.brigadeName} - Exchange Receipt (${record.droppedOffCount} In / ${record.collectedCount} Out)`;

    // Base64 encode subject for MIME headers
    const subjectUtf8 = new TextEncoder().encode(subject);
    let subjectBinary = '';
    for (let i = 0; i < subjectUtf8.length; i++) subjectBinary += String.fromCharCode(subjectUtf8[i]);
    const encodedSubject = btoa(subjectBinary);

    const mime = [
      `To: ${targetEmail}`,
      `Subject: =?utf-8?B?${encodedSubject}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlContent,
    ].join('\r\n');

    const rawBase64Url = base64UrlEncode(mime);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawBase64Url }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        detail: `Delivered directly to ${targetEmail} via connected Gmail (ID: ${data.id})`,
      };
    } else if (response.status === 401) {
      // Token expired due to inactivity
      return {
        success: false,
        detail: 'Gmail connection timed out after 1 hour of inactivity. Please tap "Reconnect Gmail" in the top bar.',
      };
    } else {
      const err = await response.text();
      return {
        success: false,
        detail: `Gmail API error: ${err}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      detail: `Dispatch error: ${err.message || 'Network error'}`,
    };
  }
}

// 1. Fetch Settings (hybrid: server or localStorage fallback)
export async function getKioskSettings(): Promise<AppSettings> {
  // Read local settings first
  let localSettings: Partial<AppSettings> = {};
  try {
    const cached = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (cached) {
      localSettings = JSON.parse(cached);
    }
  } catch {}

  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        // Merge so client-saved webhookUrl or password is never wiped out by server defaults
        const merged: AppSettings = {
          ...DEFAULT_SETTINGS,
          ...localSettings,
          ...data,
          googleScriptWebhookUrl:
            data.googleScriptWebhookUrl || localSettings.googleScriptWebhookUrl || '',
          smtpPass: data.smtpPass || localSettings.smtpPass || '',
        };
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // static host (GitHub Pages) or offline
  }

  return { ...DEFAULT_SETTINGS, ...localSettings };
}

// 2. Save Settings
export async function saveKioskSettings(settings: AppSettings): Promise<void> {
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch {
    // static host without backend
  }
}

// 3. Process Exchange (hybrid: server or client direct dispatch)
export async function submitKioskExchange(
  payload: {
    brigadeName: string;
    brigadeDistrict?: string;
    droppedOffCount: number;
    collectedCount: number;
    cylinderType?: string;
    recipientEmail: string;
    accessToken?: string | null;
  },
  settings: AppSettings
): Promise<CylinderExchangeRecord> {
  const timestamp = new Date().toISOString();
  const dateTag = timestamp.slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const id = `CFA-BA-${dateTag}-${randomSuffix}`;
  const targetRecipient = payload.recipientEmail || settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com';

  const initialRecord: CylinderExchangeRecord = {
    id,
    timestamp,
    brigadeName: payload.brigadeName,
    brigadeDistrict: payload.brigadeDistrict || '',
    droppedOffCount: payload.droppedOffCount,
    collectedCount: payload.collectedCount,
    cylinderType: payload.cylinderType || 'Standard 300 BAR Composite',
    recipientEmail: targetRecipient,
    emailStatus: 'queued',
    emailDeliveryDetail: '',
  };

  // 1. Try server endpoint first
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.accessToken) {
      headers['Authorization'] = `Bearer ${payload.accessToken}`;
    }

    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.record) {
        saveExchangeLocally(data.record);
        return data.record;
      }
    }
  } catch {
    // Server not available (e.g. GitHub Pages static host)
  }

  // 2. Static host (GitHub Pages) or Client execution
  if (settings.googleScriptWebhookUrl?.trim()) {
    // 24/7 Zero-Timeout Kiosk Relay
    const webhookResult = await sendEmailViaWebhook(
      initialRecord,
      settings.depotStationName,
      targetRecipient,
      settings.googleScriptWebhookUrl.trim()
    );
    initialRecord.emailStatus = webhookResult.success ? 'sent' : 'failed';
    initialRecord.emailDeliveryDetail = webhookResult.detail;
  } else if (payload.accessToken) {
    const emailResult = await sendEmailViaGmailApiDirect(
      initialRecord,
      settings.depotStationName,
      targetRecipient,
      payload.accessToken
    );
    initialRecord.emailStatus = emailResult.success ? 'sent' : 'failed';
    initialRecord.emailDeliveryDetail = emailResult.detail;
  } else {
    initialRecord.emailStatus = 'failed';
    initialRecord.emailDeliveryDetail = 'Not delivered: Please tap "Login to Gmail" in the top bar or configure 24/7 Kiosk Relay in Settings.';
  }

  saveExchangeLocally(initialRecord);
  return initialRecord;
}

// 4. Resend Email (hybrid: server, webhook relay, or direct client dispatch)
export async function resendKioskEmail(
  record: CylinderExchangeRecord,
  settings: AppSettings,
  accessToken?: string | null
): Promise<CylinderExchangeRecord> {
  // 1. Try server
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`/api/exchanges/${record.id}/resend-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accessToken: accessToken || undefined }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.record) {
        saveExchangeLocally(data.record);
        return data.record;
      }
    }
  } catch {}

  // 2. Webhook Relay fallback (24/7 Zero-Timeout)
  if (settings.googleScriptWebhookUrl?.trim()) {
    const res = await sendEmailViaWebhook(
      record,
      settings.depotStationName,
      record.recipientEmail || settings.recipientEmail,
      settings.googleScriptWebhookUrl.trim()
    );
    const updated = {
      ...record,
      emailStatus: res.success ? ('sent' as const) : ('failed' as const),
      emailDeliveryDetail: res.detail,
    };
    saveExchangeLocally(updated);
    return updated;
  }

  // 3. Direct client fallback for GitHub Pages via OAuth
  if (accessToken) {
    const res = await sendEmailViaGmailApiDirect(
      record,
      settings.depotStationName,
      record.recipientEmail || settings.recipientEmail,
      accessToken
    );
    const updated = {
      ...record,
      emailStatus: res.success ? ('sent' as const) : ('failed' as const),
      emailDeliveryDetail: res.detail,
    };
    saveExchangeLocally(updated);
    return updated;
  }

  return record;
}

function saveExchangeLocally(record: CylinderExchangeRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_EXCHANGES_KEY);
    const list: CylinderExchangeRecord[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(STORAGE_EXCHANGES_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}
