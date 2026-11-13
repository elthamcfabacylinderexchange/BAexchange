# Eltham Fire Brigade (CFA Victoria)
## Breathing Apparatus (BA) Cylinder Exchange Kiosk
### Comprehensive Operations, Administration, and Technical Manual

---

## 1. Executive Summary & Purpose

The **Eltham CFA BA Cylinder Exchange Kiosk** is a dedicated, touch-optimized web application designed for 24/7 unattended operation at the Eltham Fire Brigade station (District 14, Victoria). 

### Primary Objectives:
1. **Self-Service Brigade Logging**: Visiting brigades quickly log empty cylinders dropped off and full replacement cylinders collected.
2. **Instant Receipt Dispatch**: Every exchange automatically generates and dispatches an HTML transaction receipt to `elthamcfabacylinderexchange@gmail.com` with a unique reference number.
3. **CFA Swap & Go Compliance**: Prominently instructs collecting crews to scan their collected cylinders into the **CFA Swap and Go ServiceNow Now Agent app**, while clarifying that dropped-off cylinders do not require scanning.
4. **Zero-Maintenance Kiosk Operation**: Operates 24 hours a day on a wall-mounted tablet without requiring firefighters to authenticate, log into Google, or manage credentials during their shift or after power cuts.

---

## 2. Kiosk User Workflow (Firefighter Station Operations)

The kiosk layout is divided into two primary touch zones designed for rapid turnover:

```
+-----------------------------------------------------------------------------------+
|  [Eltham Logo] Eltham Fire Brigade      |  [24/7 Permanent Active]  [Reset] [Full] |
+------------------------------------+----------------------------------------------+
|                                    |  [2] CYLINDERS DROPPED OFF (EMPTY)           |
|  [1] SELECT BRIGADE                |  [-]  [  0  ]  [+]   [+2] [+4] [+6]          |
|  [Search Brigade Name / District]  |----------------------------------------------+
|                                    |  CYLINDERS COLLECTED (FULL)                  |
|  * District 14 Brigades (Quick)    |  [-]  [  0  ]  [+]   [+2] [+4] [+6]          |
|  * All CFA Brigades (Searchable)   |----------------------------------------------+
|                                    |  [3] [LOG CYLINDER EXCHANGE - TAP TO FINISH] |
+------------------------------------+----------------------------------------------+
```

### Step 1: Select Your Brigade
- The firefighter selects their brigade from the left panel.
- Fast access buttons highlight local **District 14** brigades (Eltham, Diamond Creek, Kangaroo Ground, Research, Plenty, Hurstbridge, Greensborough, etc.).
- A search bar allows filtering any brigade across Victoria.
- Selecting a brigade updates the brigade name and district badge automatically.

### Step 2: Record Cylinder Quantities
- **Dropped Off (Empty)**: Tap `+` / `-` or quick increments (`+2`, `+4`, `+6`).
- **Collected (Full)**: Tap `+` / `-` or quick increments (`+2`, `+4`, `+6`).
- **Touch Audio**: Realistic tactile clicks sound on increments/decrements (can be muted in Settings).

### Step 3: Complete Exchange
- The large green **Finish** button illuminates once a brigade is chosen and at least one cylinder is recorded.
- Tapping the button plays a confirmation chime, logs the exchange with a reference ID (e.g. `CFA-BA-20261110-4821`), and triggers background receipt delivery.

### Step 4: Collection Protocol Guidance (Completion Screen)
Upon completion, the tablet transitions to a high-contrast reminder screen displaying:
- **Receipt Reference & Summary**: Counts of dropped off and collected cylinders.
- **ServiceNow Transfer Reminder**:
  > *"Please scan each cylinder you are collecting, and transfer into your brigade upon collection using the CFA Swap and Go ServiceNow Now Agent app."*
- **Drop-Off Clarification**:
  > *"There is no need to scan the cylinders you are dropping off."*

### Step 5: Automated Kiosk Turnover
- A progress bar and countdown timer (default 10s + 20s reading buffer) automatically return the kiosk to a clean home screen ready for the next appliance.
- Firefighters can tap **Return to Home Screen** immediately or tap **Pause** to hold the screen.

---

## 3. Access & Deployment Architecture

### Web Addresses
- **Production (GitHub Pages)**: `https://elthamcfabacylinderexchange.github.io/BAexchange/`
- **Development & Server Environment**: `https://ais-dev-dwh3ledecmua72tenlscrq-508027481207.us-east1.run.app`
- **Source Code Repository**: `https://github.com/elthamcfabacylinderexchange/BAexchange`

### Tablet Kiosk Deployment (iPad / Android / Windows)

#### Option A: Progressive Web App (PWA) / Fullscreen (Recommended)
1. Open the URL in the tablet browser (Chrome on Android, Safari on iPad).
2. Tap the browser menu and select **"Add to Home Screen"** or tap the **Install Kiosk App** button in the top navigation bar.
3. Launching from the Home Screen icon opens the app in **standalone kiosk mode** (hides address bar and tabs).
4. The app includes an auto-fullscreen utility and a top-bar **Fullscreen button** to lock the display.

#### Option B: Dedicated Desktop Shortcut (Windows / Linux)
- Windows: Run `Launch-Eltham-CFA-BA-Kiosk.bat`.
- Linux: Use `Eltham-CFA-BA-Kiosk.desktop`.

---

## 4. Administration & Hidden Settings Access

To prevent accidental modification by visiting crews, all administrative controls are hidden behind a discrete gesture.

### How to Open Administrator Settings:
1. Locate the **Eltham Fire Brigade CFA logo** in the top-left corner.
2. **Tap or click the logo 3 times in rapid succession** (within 1.2 seconds).
3. The **Kiosk & Email Settings** modal will open.

```
       [Eltham Logo]  <-- TAP 3 TIMES TO OPEN SETTINGS
  +-----------------------+
  |  Eltham Fire Brigade  |
  |  CFA BA Kiosk         |
  +-----------------------+
```

### Configurable Settings:

| Setting | Default Value | Purpose |
| :--- | :--- | :--- |
| **Google Apps Script Webhook URL** | Configured URL | 24/7 permanent auto-dispatch endpoint (zero timeouts). |
| **Receipt Target Email** | `elthamcfabacylinderexchange@gmail.com` | Primary inbox receiving every exchange record. |
| **Station / Depot Description** | `Eltham Fire Brigade BA Maintenance Cache & Fill Station` | Subtitle printed on station header and receipts. |
| **Tablet Touch Audio** | Enabled (`true`) | Audio feedback on button taps and completion chimes. |
| **Auto-Reset Timer** | 10 Seconds | Delay before completion screen returns to home screen. |
| **Google App Password** | Optional | 16-letter App Password for server SMTP mode. |

---

## 5. Automated Email Delivery & Authentication

The kiosk supports three email dispatch pathways, engineered specifically to ensure emails never fail even if a tablet restarts or loses network temporarily:

```
+-----------------------------------------------------------------------------------+
|                        KIOSK RECEIPT DISPATCH ENGINE                              |
+-----------------------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
 [Method 1: Primary]                                 [Method 2: Fallback]
 Google Apps Script Webhook Relay                     Direct Google OAuth Session
 - 24/7 zero-timeout                                  - 60-minute token validity
 - Survives infinite reboots                          - Interactive login required
 - Requires NO login on tablet                        - Fallback if webhook missing
         |                                                   |
         +-------------------------+-------------------------+
                                   |
                          [Method 3: Backend]
                          Google App Password (SMTP)
                          - Node.js server delivery
```

### Method 1: Permanent 24/7 Google Apps Script Webhook (Recommended)

Google OAuth tokens strictly expire after 60 minutes. Because this kiosk runs unattended 24/7, interactive OAuth logins expire overnight. 

The **Google Apps Script Webhook Relay** runs directly in Google Cloud under `elthamcfabacylinderexchange@gmail.com`. It **never times out**, **never expires**, and **survives every tablet reboot**.

#### The Google Apps Script Code:
```javascript
// 1. SELECT "setup" AND CLICK RUN (▶️) ONCE TO GRANT GMAIL PERMISSION
function setup() {
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "CFA BA Kiosk Webhook Test",
    "Success! Your Google Apps Script is authorized and ready to dispatch kiosk receipts."
  );
}

// 2. Automated webhook that sends exchange receipts 24/7
function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var to = data.to || "elthamcfabacylinderexchange@gmail.com";
    var subject = data.subject || "CFA BA Cylinder Exchange Receipt";
    var html = data.html || "<p>Exchange Logged</p>";

    GmailApp.sendEmail(to, subject, "Please view receipt in an HTML email client.", {
      htmlBody: html,
      name: "CFA BA Cylinder Exchange Kiosk"
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

#### Step-by-Step Setup Guide:
1. Open **[script.new](https://script.new)** while logged into `elthamcfabacylinderexchange@gmail.com`.
2. Replace all placeholder code with the script above.
3. **Authorize the script (Crucial Step)**:
   - In the Apps Script toolbar, select **`setup`** from the function dropdown.
   - Click the **Run** button (play icon ▶️).
   - Google will show *"Authorization required"* &rarr; click **Review permissions**.
   - Choose `elthamcfabacylinderexchange@gmail.com`.
   - Click **Advanced** (bottom left) &rarr; click **Go to Untitled project (unsafe)** &rarr; click **Allow**.
   - Check your Gmail inbox: you will receive a test email titled *"CFA BA Kiosk Webhook Test"*.
4. **Deploy as Web App**:
   - Click the blue **Deploy** button (top right) &rarr; **New deployment**.
   - Click the gear icon next to "Select type" &rarr; select **Web app**.
   - Set **Execute as**: `Me (elthamcfabacylinderexchange@gmail.com)`.
   - Set **Who has access**: `Anyone` *(Crucial: do not select "Only myself")*.
   - Click **Deploy** and copy the **Web app URL** (must end in `/exec`).
5. **Paste into Kiosk**:
   - On the kiosk tablet, **tap the Eltham logo 3 times**.
   - Paste the URL into **Google Apps Script Webhook URL**.
   - Tap **Save Settings**, then tap **Test Webhook Dispatch**.

---

### Method 2: Direct Google OAuth 2.0 Login (Gmail API)

- Located inside the Settings modal under **Gmail Interactive Login**.
- Supports both **Login with Google** (popup) and **Tablet Sign-In (Redirect)** (full-page redirect for iPads and tablets where popups are blocked).
- Dispatches receipts via `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`.
- **Note on Expiry**: Access tokens are valid for 3,600 seconds (60 minutes). A live countdown badge in the top bar indicates remaining minutes (e.g. `(54m)`).

---

### Method 3: 16-Letter Google App Password (SMTP)

- When hosting on a full-stack Node.js server (`server.ts`), emails can also be sent via standard SMTP on port 465 (`smtp.gmail.com`).
- Requires a 16-character Google App Password generated from `myaccount.google.com/apppasswords`.

---

## 6. Data Integrity & Offline Protection

- **Local Transaction Cache**: Every exchange is saved to the tablet's browser storage (`localStorage` under `cfa_kiosk_exchanges_v1`, storing up to 50 historical records).
- **Settings Persistence**: Settings are cached in `cfa_kiosk_settings_v1`. On tablet reboots, settings (including the Webhook URL and Station name) are synchronously loaded on Frame 0 before any network request, preventing settings loss.
- **Fail-Safe Dispatch Ladder**: When an exchange is submitted:
  1. The kiosk pings the backend `/api/exchange`.
  2. If the backend is unavailable or does not have credentials, the client immediately initiates Webhook relay delivery.
  3. If the Webhook fails and an OAuth token is present, it attempts direct Gmail API dispatch.
  4. If all automated methods fail, the completion screen provides a 1-tap **Send via Gmail Web** fallback button so no data is ever lost.

---

## 7. Troubleshooting & Operator FAQ

### Q1: The top bar says "Gmail Connected [24/7 Permanent]", what does this mean?
> **Answer**: This confirms that the Google Apps Script Webhook is active. The kiosk will dispatch emails permanently through all reboots and overnight periods without requiring firefighters to log in.

### Q2: Why did an exchange show "Automated Email Not Sent"?
> **Answer**: 
> 1. Tap the Eltham logo 3 times to enter Settings.
> 2. Ensure the **Google Apps Script Webhook URL** field contains a valid URL ending in `/exec`.
> 3. Verify that you ran the `setup` function once in Google Apps Script to authorize permissions. If you deployed without running `setup`, Google blocks email sending.
> 4. Ensure **Who has access** was set to **Anyone** in Google Apps Script deployment settings.

### Q3: How do I change the station description or depot name?
> **Answer**: Tap the Eltham logo 3 times, switch to the **Station Options** tab, update the **Station / Depot Header Description**, and tap **Save Settings**.

### Q4: How do firefighters scan cylinders when dropping off or collecting?
> **Answer**: 
> - **Dropped off (empty)** cylinders: Do **not** scan into ServiceNow.
> - **Collected (full)** cylinders: Open the **CFA Swap and Go ServiceNow Now Agent app** on their brigade mobile phone/appliance tablet and scan each cylinder barcode into their brigade.

### Q5: Can I resend an email for an exchange that failed earlier?
> **Answer**: Yes. On the completion screen, tap **Retry Dispatching Email** or tap **Send via Gmail Web** to open a pre-filled Gmail draft directly.

---

## 8. Technical File Inventory

| File Path | Function / Responsibility |
| :--- | :--- |
| `src/components/TopNav.tsx` | Kiosk header, 24/7 status badge, Eltham logo 3-tap gesture, fullscreen toggle. |
| `src/components/BrigadeSelector.tsx` | District 14 quick buttons and Victoria-wide brigade search panel. |
| `src/components/CylinderCounter.tsx` | High-contrast touch counters for dropped off and collected cylinders. |
| `src/components/FinishSection.tsx` | Validation and submission trigger for the exchange transaction. |
| `src/components/CompletionScreen.tsx` | Success banner, ServiceNow scanning reminder, auto-reset timer. |
| `src/components/SettingsModal.tsx` | 3-tap admin modal, Webhook configuration, Apps Script guide, station options. |
| `src/services/kioskClient.ts` | HTML email generator, Webhook dispatcher, Gmail API client, local caching. |
| `src/services/auth.ts` | Firebase Google Auth service, token caching, tablet redirect handling. |
| `src/utils/fullscreen.ts` | Auto-fullscreen controller with gesture protection for touchscreens. |
| `server.ts` | Express API server, SMTP transport, persistent JSON storage. |

---

*Eltham Fire Brigade · Country Fire Authority Victoria · Document Reference: CFA-BA-MANUAL-2026*
