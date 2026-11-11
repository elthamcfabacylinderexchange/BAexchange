import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data folder exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EXCHANGES_FILE = path.join(DATA_DIR, 'exchanges.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Initial defaults
const DEFAULT_SETTINGS = {
  recipientEmail: 'elthamcfabacylinderexchange@gmail.com',
  senderEmail: 'elthamcfabacylinderexchange@gmail.com',
  depotStationName: 'Eltham Fire Brigade BA Maintenance Cache & Fill Station',
  soundEnabled: true,
  autoResetSeconds: 10,
  requireMemberDetails: false,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: 'elthamcfabacylinderexchange@gmail.com',
  smtpPass: '',
  googleScriptWebhookUrl: '',
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: typeof DEFAULT_SETTINGS) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

function getExchanges() {
  try {
    if (fs.existsSync(EXCHANGES_FILE)) {
      return JSON.parse(fs.readFileSync(EXCHANGES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading exchanges:', err);
  }
  return [];
}

function saveExchanges(exchanges: any[]) {
  fs.writeFileSync(EXCHANGES_FILE, JSON.stringify(exchanges, null, 2), 'utf-8');
}

app.use(express.json());

// Helper to format HTML email (simplified, clean body)
function generateEmailHtml(record: any, depotName: string) {
  const dateFormatted = new Date(record.timestamp).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return `
<!DOCTYPE html>
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
</html>
  `;
}

// Mailer configuration & dispatching
async function sendNotificationEmail(
  record: any,
  depotName: string,
  recipientEmail: string,
  settings: any,
  accessToken?: string | null
) {
  const senderEmail = settings?.senderEmail || 'elthamcfabacylinderexchange@gmail.com';
  const targetRecipient = recipientEmail || settings?.recipientEmail || 'elthamcfabacylinderexchange@gmail.com';

  const htmlContent = generateEmailHtml(record, depotName);
  const subject = `[CFA BA Kiosk] ${record.brigadeName} - Exchange Receipt (${record.droppedOffCount} In / ${record.collectedCount} Out)`;
  const textContent = `CFA BA Cylinder Exchange Receipt: ${record.id}
Brigade: ${record.brigadeName}
Dropped Off: ${record.droppedOffCount}
Collected: ${record.collectedCount}
Time: ${new Date(record.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`;

  // 1. Permanent 24/7 Google Apps Script Webhook Relay (Zero-Timeout)
  const webhookUrl = (settings?.googleScriptWebhookUrl || process.env.GOOGLE_SCRIPT_WEBHOOK_URL || '').trim();
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      let cleanUrl = webhookUrl;
      if (cleanUrl.includes('/edit')) cleanUrl = cleanUrl.replace(/\/edit.*$/, '/exec');
      if (cleanUrl.includes('/dev')) cleanUrl = cleanUrl.replace(/\/dev.*$/, '/exec');

      const webhookRes = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetRecipient,
          subject,
          html: htmlContent,
          recordId: record.id,
          brigade: record.brigadeName,
          dropped: record.droppedOffCount,
          collected: record.collectedCount,
        }),
      });

      const responseBody = await webhookRes.text();
      console.log(`[SERVER WEBHOOK DISPATCH] Status: ${webhookRes.status}, Response: ${responseBody.slice(0, 150)}`);

      if (webhookRes.ok) {
        return {
          status: 'sent' as const,
          hasSmtp: true,
          detail: `Delivered directly to ${targetRecipient} inbox via 24/7 Zero-Timeout Kiosk Relay`,
        };
      } else {
        console.warn(`[SERVER WEBHOOK WARNING] Status: ${webhookRes.status}`);
      }
    } catch (err: any) {
      console.error('Server webhook dispatch error:', err);
    }
  }

  // 2. If an OAuth access token is provided from Gmail Login, send directly via official Gmail API
  if (accessToken) {
    try {
      const mimeLines = [
        `To: ${targetRecipient}`,
        `Subject: =?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        htmlContent,
      ];
      const rawMime = mimeLines.join('\r\n');
      const rawBase64Url = Buffer.from(rawMime, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawBase64Url }),
      });

      if (response.ok) {
        const gmailData = (await response.json()) as any;
        console.log(`[GMAIL API SENT SUCCESS] Message ID: ${gmailData.id} dispatched to ${targetRecipient}`);
        return {
          status: 'sent' as const,
          hasSmtp: true,
          detail: `Delivered directly to ${targetRecipient} inbox via connected Gmail (ID: ${gmailData.id})`,
        };
      } else {
        const errBody = await response.text();
        console.error('Gmail API send error:', errBody);
      }
    } catch (err: any) {
      console.error('Error dispatching via Gmail API:', err);
    }
  }

  // 2. Check SMTP settings (from settings or env)
  const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(settings?.smtpPort || process.env.SMTP_PORT) || 465;
  const smtpSecure = settings?.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : (smtpPort === 465);
  const smtpUser = settings?.smtpUser || process.env.SMTP_USER || senderEmail;
  const rawPass = settings?.smtpPass || process.env.SMTP_PASS || '';
  const smtpPass = rawPass.trim().replace(/\s+/g, '');

  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Eltham Fire Brigade BA Kiosk" <${senderEmail}>`,
        to: targetRecipient,
        replyTo: senderEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[SMTP SENT SUCCESS] From: ${senderEmail} To: ${targetRecipient} ID: ${info.messageId}`);
      return {
        status: 'sent' as const,
        hasSmtp: true,
        detail: `Delivered directly to ${targetRecipient} inbox via Gmail (ID: ${info.messageId})`,
      };
    } catch (err: any) {
      console.error('SMTP sending error:', err);
      return {
        status: 'failed' as const,
        hasSmtp: true,
        detail: `Gmail SMTP rejected: ${err.message}. Please check your 16-letter Google App Password.`,
      };
    }
  }

  // 3. When neither Gmail login nor App Password is configured
  console.warn(`[EMAIL DISPATCH PENDING] Receipt ${record.id} saved for ${targetRecipient}, but no Gmail login session or App Password is active.`);

  return {
    status: 'failed' as const,
    hasSmtp: false,
    detail: `Not delivered to inbox: Please tap 'Login to Gmail' in the top bar or configure an App Password in Settings.`,
  };
}

// API Routes
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  const current = getSettings();
  const updated = {
    ...current,
    ...req.body,
  };
  saveSettings(updated);
  res.json({ success: true, settings: updated });
});

app.get('/api/exchanges', (req, res) => {
  const exchanges = getExchanges();
  res.json({
    exchanges,
    totalRecords: exchanges.length,
    totalDropped: exchanges.reduce((acc: number, cur: any) => acc + (cur.droppedOffCount || 0), 0),
    totalCollected: exchanges.reduce((acc: number, cur: any) => acc + (cur.collectedCount || 0), 0),
  });
});

app.post('/api/exchange', async (req, res) => {
  try {
    const settings = getSettings();
    const payload = req.body;

    const timestamp = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const id = `CFA-BA-${dateTag}-${randomSuffix}`;

    const recipient = settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com';
    const sender = settings.senderEmail || 'elthamcfabacylinderexchange@gmail.com';

    const record = {
      id,
      timestamp,
      brigadeName: payload.brigadeName || 'Unknown Brigade',
      brigadeDistrict: payload.brigadeDistrict || '',
      firefighterName: payload.firefighterName || '',
      firefighterMemberId: payload.firefighterMemberId || '',
      vehicleCallSign: payload.vehicleCallSign || '',
      droppedOffCount: Number(payload.droppedOffCount) || 0,
      collectedCount: Number(payload.collectedCount) || 0,
      cylinderType: payload.cylinderType || 'Standard 300 BAR Carbon Composite',
      serialNumbers: payload.serialNumbers || [],
      defectReported: Boolean(payload.defectReported),
      defectNotes: payload.defectNotes || '',
      generalNotes: payload.generalNotes || '',
      recipientEmail: recipient,
      emailStatus: 'queued',
      emailDeliveryDetail: '',
    };

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const accessToken = bearerToken || payload.accessToken || null;

    const webhookUrl = payload.googleScriptWebhookUrl || payload.webhookUrl || settings.googleScriptWebhookUrl;
    const mergedSettings = { ...settings, googleScriptWebhookUrl: webhookUrl };

    // Attempt email dispatch automatically (via connected Gmail API, SMTP or local queue)
    const emailResult = await sendNotificationEmail(record, settings.depotStationName, recipient, mergedSettings, accessToken);
    record.emailStatus = emailResult.status;
    record.emailDeliveryDetail = emailResult.detail;

    // Save record to persistent storage
    const exchanges = getExchanges();
    exchanges.unshift(record);
    saveExchanges(exchanges);

    res.status(201).json({
      success: true,
      record,
    });
  } catch (error: any) {
    console.error('Error handling exchange:', error);
    res.status(500).json({ error: error.message || 'Failed to process exchange' });
  }
});

app.post('/api/exchanges/:id/resend-email', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = getSettings();
    const exchanges = getExchanges();
    const index = exchanges.findIndex((e: any) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Exchange record not found' });
    }

    const record = exchanges[index];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const accessToken = bearerToken || req.body.accessToken || null;
    const webhookUrl = req.body.googleScriptWebhookUrl || req.body.webhookUrl || settings.googleScriptWebhookUrl;
    const mergedSettings = { ...settings, googleScriptWebhookUrl: webhookUrl };

    const emailResult = await sendNotificationEmail(
      record,
      settings.depotStationName,
      record.recipientEmail || settings.recipientEmail,
      mergedSettings,
      accessToken
    );

    record.emailStatus = emailResult.status;
    record.emailDeliveryDetail = emailResult.detail;
    exchanges[index] = record;
    saveExchanges(exchanges);

    res.json({
      success: emailResult.status === 'sent',
      status: emailResult.status,
      detail: emailResult.detail,
      record,
    });
  } catch (error: any) {
    console.error('Error resending email:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to resend email' });
  }
});

app.post('/api/send-test-email', async (req, res) => {
  try {
    const settings = getSettings();
    const targetEmail = req.body.email || settings.recipientEmail || 'elthamcfabacylinderexchange@gmail.com';
    const senderEmail = settings.senderEmail || 'elthamcfabacylinderexchange@gmail.com';
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const accessToken = bearerToken || req.body.accessToken || null;

    const providedPass = req.body.smtpPass !== undefined ? req.body.smtpPass : settings.smtpPass;
    const rawPass = (providedPass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
    const testWebhook = (req.body.webhookUrl || req.body.googleScriptWebhookUrl || settings.googleScriptWebhookUrl || '').trim();

    if (!accessToken && !rawPass && !testWebhook) {
      return res.status(400).json({
        success: false,
        error: 'Please paste your Google Apps Script Webhook URL, log in to Gmail, or enter your 16-letter Google App Password.',
      });
    }

    const testSettings = {
      ...settings,
      googleScriptWebhookUrl: testWebhook,
      smtpPass: rawPass,
      senderEmail,
      recipientEmail: targetEmail,
    };

    const testRecord = {
      id: `CFA-TEST-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      brigadeName: 'Eltham Fire Brigade (Diagnostic Test)',
      droppedOffCount: 2,
      collectedCount: 2,
      cylinderType: 'Standard 300 BAR Composite',
      recipientEmail: targetEmail,
      generalNotes: 'Direct diagnostic test email dispatched from Kiosk Settings',
    };

    const result = await sendNotificationEmail(testRecord, settings.depotStationName, targetEmail, testSettings, accessToken);

    if (result.status === 'sent') {
      // Auto-save the confirmed working password so form submissions work immediately!
      const current = getSettings();
      saveSettings({ ...current, smtpPass: rawPass, recipientEmail: targetEmail, senderEmail });
      return res.json({
        success: true,
        from: senderEmail,
        to: targetEmail,
        result,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.detail || 'Gmail rejected connection. Please check your 16-character App Password.',
        result,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Test dispatch failed' });
  }
});

app.get('/api/exchanges/:id/email-preview', (req, res) => {
  const exchanges = getExchanges();
  const settings = getSettings();
  const record = exchanges.find((e: any) => e.id === req.params.id);
  if (!record) {
    return res.status(404).send('Record not found');
  }
  const html = generateEmailHtml(record, settings.depotStationName);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CFA BA Kiosk Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
