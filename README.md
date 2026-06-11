# Lotos (Λωτός) — Personal Privacy & Data Broker Deletion Stage

<div align="center">
  <p align="center">
    <strong>A secure, self-hosted, private workspace to coordinate, draft, send, and track personal data broker removals.</strong>
  </p>
  <p align="center">
    <a href="#key-features">Key Features</a> •
    <a href="#technical-architecture">Technical Architecture</a> •
    <a href="#setup--deployment">Setup & Deployment</a> •
    <a href="#google-cloud-setup">Google Cloud OAuth Setup</a> •
    <a href="#privacy--security">Privacy Philosophy</a>
  </p>
</div>

---

**Lotos (Λωτός)** is an AI-powered, self-hosted personal privacy agent designed to help individuals locate, request deletion from, and track their opt-out status across major data brokers, people-search directories, recruitment crawlers, and adtech trackers.

Unlike commercial privacy services that require you to share your sensitive profiles, passwords, and billing information with yet another centralized database, Lotos operates **entirely locally**. Your personal identity profile, tracking history, and advisor chat logs never leave your browser’s local storage. The companion Node.js/Express server functions exclusively as a secure API broker for the Gemini LLM and the Gmail sending integration.

---

## Key Features

### 📊 Dynamic Dashboard & Progress Tracking
- **Progress Overview:** Real-time visibility into your deletion progress across all configured data brokers.
- **Timeline Logs:** Historical records detailing exactly when emails were sent, status changed, or web forms were visited.

### 👤 Local Personal Profile
- **Personal Vault:** Manage your details (phone, alternative emails, addresses, city, postal code) safely.
- **Zero Cloud Storage:** All details are kept safely inside browser `localStorage`.
- **Automatic Sync:** Profiles automatically connect to your Google Account details upon OAuth login.

### 🔍 Tailored Data Broker Directory
Features a pre-configured database of high-impact data brokers categorized into four main sectors:
1. **People Search (Critical Greek Directories):** National registries like **11888.gr (OTE)**, **Vrisko.gr**, **xo.gr (Greek Yellow Pages)**, and **11880.gr**.
2. **Marketing & AdTech:** Retargeting giants and data agencies including **Criteo**, **Yahoo EMEA**, **Ogury**, **RTB House**, **Sirdata**, **The Trade Desk**, and **Quantcast**.
3. **Recruitment & B2B Lead Gen:** B2B scraping databases including **Cognism**, **Apollo.io**, **ZoomInfo**, **RocketReach**, and **Lusha**.
4. **Financial & Risk Assessment:** Solvency and risk databases, notably **Tiresias SA (Τειρεσίας)**, **Dun & Bradstreet (D&B)**, **Experian**, **Equifax**, and **TransUnion**.

### ✉️ Gemini AI-Powered Legal Requests
- **Customized Legal Drafting:** Instantly drafts formal deletion demands customized for the user's region and legal frameworks (e.g., **EU GDPR**, **Greek Law 4624/2019**, **Greek Telecommunications Law 3471/2006 (Article 11)**, or **California CCPA/CPRA**).
- **Direct Gmail API Dispatch:** Authenticate with your Google account to review and send compiled deletion drafts directly from your personal Gmail address in one click.
- **Auto-Check Replies:** Checks your Gmail inbox to identify recent replies or automated ticket submissions matching data broker domains.

### 💬 "Lotos Guide" AI Privacy Advisor *(Optional)*
> [!NOTE]
> The Compliance Advisor AI chat is an **optional** feature. If a user does not configure a `GEMINI_API_KEY`, the application remains fully functional for manual/Gmail deletion management, and the advisor page will present a setup onboarding guide instead.

- **Conversational Privacy Coach:** An interactive chatbot powered by Gemini designed to explain privacy rights, national legislation, and unlisting procedures.
- **Objection Analyzer:** Paste lazy boilerplate rejections or high-friction validation emails received from brokers, and the AI will draft firm, legally backed follow-ups and escalation templates.
- **HDPA Referral Assistance:** Assists EU and Greek users in drafting petitions to the **Hellenic Data Protection Authority (HDPA / Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα, dpa.gr)** if brokers refuse compliance.

---

## Technical Architecture

The workspace is organized as a unified monorepo serving a React frontend via a lightweight Node.js/Express server:

```
├── package.json         # Build scripts & package dependencies
├── server.ts            # Node.js Express server (Gemini & Google OAuth Proxies)
├── vite.config.ts       # Vite bundler configurations & HMR controls
├── tsconfig.json        # TypeScript configuration
├── index.html           # SPA entry point
├── src/
│   ├── App.tsx          # Main layout, State managers, Tab routers & OAuth handlers
│   ├── main.tsx         # React app mounter
│   ├── index.css        # Tailwind CSS styling framework integration
│   ├── types.ts         # TypeScript structural definitions
│   ├── components/      # React UI modules (Dashboard, BrokerList, OptOutPanel, etc.)
│   ├── data/            # Static databases (brokers.ts database, translations.ts)
│   └── utils/           # Helper scripts (greekUtils.ts, etc.)
```

### Stack Breakdown
- **Frontend Framework:** React 19, Vite, Tailwind CSS v4, Motion (Framer Motion).
- **Icons:** Lucide React.
- **Backend Runtime:** Node.js, Express, TypeScript, `tsx` (TypeScript Execute).
- **AI Engine:** `@google/genai` (Vite backend SDK) utilizing the fast and efficient **gemini-3.5-flash** model.

---

## Setup & Deployment

### Prerequisites
- **Node.js:** v18.0.0 or higher.
- **Gemini API Key:** Obtainable from [Google AI Studio](https://aistudio.google.com/).
- **Google Cloud Developer Project:** Required to set up Google OAuth Client details for Gmail features.

### 1. Installation
Clone this repository to your local directory and install the required node dependencies:
```bash
npm install
```

### 2. Environment Configurations
Create a `.env` file in the root directory (you can copy `.env.example` as a starting point) and specify the following variables:
```env
# Gemini AI Platform Credentials (Optional: chatbot requires this key, otherwise onboarding setup guide is shown)
GEMINI_API_KEY="AI_STUDIO_GENERATED_API_KEY"

# Self-Hosted App Details
PORT=3000
NODE_ENV="development" # or "production"

# Google OAuth Client Credentials (Needed for Gmail sending & tracking)
GOOGLE_CLIENT_ID="XXXXXX-XXXXXXXXXXXXXXXX.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-XXXXXXXXXXXXXXXXXXXXXXX"
```

---

## Google Cloud Setup

To enable digital dispatching (sending emails via Gmail API) and automatic status checking, you must configure a Google Cloud project to obtain OAuth credentials.

### Step 1: Create a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project**, name it `Lotos Privacy Shield` (or any custom identifier), and select your billing account (it operates under Google's free tier quotas).

### Step 2: Enable Google APIs
1. In your project, navigate to **APIs & Services** > **Library**.
2. Search for and **Enable** the following APIs:
   - **Gmail API** (needed to send opt-outs and read reply statuses).
   - **Google People API** / **User Profile API** (needed to sync profile name/avatar).

### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Set the User Type to **External**.
3. Fill out the application details (e.g., App Name: `Lotos Core`, Support Email: your email).
4. Under **Scopes**, click **Add or Remove Scopes** and add the following:
   - `openid` (User profile identifier)
   - `.../auth/userinfo.email` (View email address)
   - `.../auth/userinfo.profile` (View basic profile details)
   - `https://www.googleapis.com/auth/gmail.send` (Send emails on your behalf)
   - `https://www.googleapis.com/auth/gmail.readonly` (Read message headers to verify replies)
5. Under **Test Users**, add your personal Google/Gmail address. Since the application remains in "Testing" mode on your personal console, only defined test accounts can log in.

### Step 4: Generate OAuth Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Select Application Type: **Web application**.
4. Add the following to **Authorized Redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback` (or your production domain callback path).
5. Click **Create** and copy your **Client ID** and **Client Secret** into your `.env` file.

---

## Running the Application

### Running in Development
To boot the application locally with hot-reloading Vite dev middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running in Production (Node.js)
To create a production-optimized package (Vite static build + bundled server script) and run it:
```bash
# Build the React frontend and bundle the Express server
npm run build

# Start the Node.js production server
npm run start
```

### Running with Docker (Recommended for Self-Hosting)
Lotos includes a `Dockerfile` and a `docker-compose.yml` to bundle and deploy easily as a container.

1. **Configure Environment Variables**:
   By default, Lotos is configured to read values from a local `.env` file in the same directory.
   - **Using `.env`**: Create a `.env` file in the root directory (based on `.env.example`) and fill in your keys.
   - **Using Inline Configuration**: Alternatively, if you are hosting Lotos on a personal home server (e.g., via Portainer or Synology UI), you can skip the `.env` file entirely and replace the `${VARIABLE_NAME}` entries directly with your actual keys and passwords inside the `docker-compose.yml` environment block.

2. **Build and Start Container**:
   Build the image and launch the container in detached mode:
   ```bash
   docker compose up -d --build
   ```

3. **Verify running status**:
   Ensure the container is running:
   ```bash
   docker compose ps
   ```

The container maps port `3000` to your host and mounts a named Docker volume (`lotos-data`) to persist your tracking state and profile credentials in `/app/data/state.json`.

---

## Background Deletion Sweeps

Lotos supports automated background scans to detect when a data broker replies to your pending opt-out requests. This runs silently in the background on your server using an internal dynamic scheduler.

### How it Works
1. When you authenticate with Google, Lotos securely caches your Gmail API refresh token in the server's local `state.json`.
2. A background scheduler loop on the server checks every minute whether the configured interval (defaulting to **12 hours**) has elapsed since the last sweep.
3. When the interval is reached, the server refreshes the credentials, searches Gmail for new messages from any broker in a **Pending** status, and updates their status to **Action Required** if a reply is received.
4. When you open the application, Lotos automatically syncs the updated state from the server to your browser interface.

### Configuration & Manual Triggers
- **Configure Frequency:** You can enable/disable background sweeps and adjust the hourly sweep interval directly from the **Settings & Governance** tab in the web UI.
- **Trigger Manually:** You can also trigger an immediate sweep at any time by clicking the **Trigger Sweep Now** button in the Settings page.
- **Environment Variables:** The defaults can be set via environment variables in your `.env` file:
  - `DISABLE_INTERNAL_SWEEP="true"` (to disable the internal scheduler entirely)
  - `SWEEP_INTERVAL_HOURS="12"` (to set the default hourly frequency)

### Alternative: External Cron Job (Optional)
If you prefer to run sweeps via an external system scheduler (e.g., system crontab), you can set `DISABLE_INTERNAL_SWEEP="true"` in your `.env` and trigger the API endpoint manually:

1. Open your system's crontab editor:
   ```bash
   crontab -e
   ```
2. Add a line to execute the sweep endpoint (e.g., every 12 hours). Pass your passcode in the `Authorization` header to authenticate:
   ```bash
   0 */12 * * * curl -s -H "Authorization: Bearer <LOTOS_PASSWORD>" http://localhost:3000/api/cron/sweep > /dev/null
   ```

---

## Privacy & Security

Lotos is built on a foundation of absolute privacy:
- **Local Server Persistence:** To support background sweeps without heavy external database services, Lotos stores a single `state.json` file in the root of your self-hosted server. This file holds your profile coordinates, progress parameters, history logs, and encrypted Gmail API refresh tokens. It never leaves your machine.
- **Local Control:** A complete progress database backup can be downloaded as a JSON file at any time from the Settings tab. You can also completely wipe your footprint from both the browser client and the server config using the **Purge Workspace** option.
