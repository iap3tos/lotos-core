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

## Google Cloud Setup (Step-by-Step for Beginners)

To allow Lotos to send opt-out emails and scan for broker responses, you must link it with your Google Account. Because this app is private and self-hosted on your own computer/server, Google requires you to create your own "private gateway key" (OAuth Client ID and Client Secret).

Follow these exact steps to get your keys in 5 minutes:

### Step 1: Create a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/) in your browser and log in with your Gmail account.
2. At the top of the page, click the project dropdown (it might say **Select a project**, or show a default project name).
3. A popup will open. Click the **New Project** button in the top-right of that popup.
4. Fill in the **Project name** field with exactly: `Lotos Shield`
5. Click **Create** at the bottom. Wait 5-10 seconds for the circle icon to finish spinning.
6. A notification banner will appear saying "Project Created". Click **Select Project** in that notification, or use the top dropdown to select your new `Lotos Shield` project.

---

### Step 2: Turn on Google APIs
You need to tell Google to allow Lotos to access your Gmail and Profile.
1. Click the **Navigation Menu** (the three horizontal lines icon in the top-left corner of the page).
2. Hover over **APIs & Services** and click on **Library**.
3. In the search box in the center, type `Gmail API` and press Enter.
4. Click on the card that says **Gmail API**, then click the blue **Enable** button.
5. Once enabled, click the back arrow at the top or go back to the **Library** search.
6. In the search box, type `Google People API` and press Enter.
7. Click on the card that says **Google People API**, then click the blue **Enable** button.

---

### Step 3: Configure the OAuth Consent Screen
This step tells Google what name to show when you sign in.
1. Click the **Navigation Menu** (three lines, top-left), hover over **APIs & Services**, and click **OAuth consent screen**.
2. Under "User Type", select **External** (it is the only option available for free personal accounts). Click **Create**.
3. Under **App information**, fill in:
   * **App name**: type exactly `Lotos App`
   * **User support email**: select your Gmail address from the dropdown list.
4. Scroll all the way to the bottom of the page to **Developer contact information** and type your personal email address in the box.
5. Click **Save and Continue**.
6. **Scopes Page:** Scroll to the bottom and click **Save and Continue** (Lotos requests these dynamically at login, no setup needed here).
7. **Test Users Page (CRITICAL STEP):**
   * Since this is a private personal app, Google blocks all logins unless you list them.
   * Click **+ ADD USERS**.
   * Type your exact Gmail address in the box.
   * Click **Add** (or press Enter), then click **Save and Continue**.
8. Scroll to the bottom of the summary page and click **Back to Dashboard**.

---

### Step 4: Generate your Gateway Keys
1. In the left-hand menu, click **Credentials**.
2. Click the **+ Create Credentials** button at the top of the page, and select **OAuth client ID** from the dropdown.
3. Under **Application type**, select **Web application** from the dropdown list.
4. In the **Name** field, type exactly `Lotos Web Server`
5. Scroll down to the bottom section called **Authorized redirect URIs**.
6. Click the **+ ADD URI** button under that section.
7. Paste this exact text into the text box:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
   *(Note: If you host Lotos on a home server or custom NAS domain, replace `http://localhost:3000` with your actual server IP/domain, keeping the `/api/auth/google/callback` suffix).*
8. Click **Create** at the bottom of the page.
9. A popup titled **OAuth client created** will appear showing your keys!
   * Copy the **Client ID** and paste it into the `GOOGLE_CLIENT_ID` setting in your `.env` or `docker-compose.yml`.
   * Copy the **Client Secret** and paste it into the `GOOGLE_CLIENT_SECRET` setting in your `.env` or `docker-compose.yml`.

> [!TIP]
> **Safety First:** Your Client ID and Client Secret are completely private. Because you created them inside your own Google Account, they belong 100% to you and are never shared with anyone.

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

You can self-host Lotos using Docker either by pulling the pre-built image from GitHub Container Registry (GHCR) or by building it locally.

#### Option A: Pull Pre-built Image (Easiest & Fastest)
You do not need to clone the repository or install Node.js locally.

1. **Download the Docker Compose file**:
   Save the [docker-compose.example.yml](file:///home/iap3tos/lotos-core/docker-compose.example.yml) template as `docker-compose.yml` on your server.
2. **Configure Environment Variables**:
   Create a `.env` file in the same directory (based on `.env.example`) or edit the `environment` variables block directly in your `docker-compose.yml` file.
3. **Start the Container**:
   ```bash
   docker compose up -d
   ```

#### Option B: Build Locally (For Development)
If you want to customize the source code before running:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/iap3tos/lotos-core.git
   cd lotos-core
   ```
2. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example` in the root directory.
3. **Build and Run**:
   ```bash
   docker compose up -d --build
   ```

### Verifying and Accessing Lotos
Regardless of the method chosen:
* **Verify running status**: `docker compose ps`
* **Access the web UI**: Open [http://localhost:3000](http://localhost:3000) in your browser.
* **Data Persistence**: The container maps port `3000` to the host and mounts a named Docker volume (`lotos-data`) to persist your tracking state and profile credentials securely in `/app/data/state.json`.

---

## Background Deletion Sweeps & Resubmission Tracking

Lotos supports automated background scans to detect broker responses and manage automatic data broker deletion resubmissions. Because data brokers frequently re-acquire and re-list your personal data, unlistings require periodic re-verification. Lotos manages this cycle automatically using an internal dynamic scheduler.

### How it Works
1. **Gmail Authentication**: When you connect your Google Account, Lotos securely caches your encrypted Gmail API refresh token in the server's local `state.json`.
2. **Background Scheduler**: A server-side scheduler loop runs every 60 seconds. It checks if the configured sweep interval (defaulting to **12 hours**) has elapsed since the last run.
3. **Inbound Reply Checks**: During a sweep, Lotos searches your Gmail inbox for messages from any broker currently in a **Pending** status. If a new response is detected, the status updates to **Action Required** with the message snippet logged.
4. **Resubmission Tracking**:
   - When a broker is marked **Completed** (verified), a countdown timer is initialized based on the completion timestamp (`completedAt`).
   - The default resubmission cycle is **3 months (90 days)**, but it is fully configurable in the settings panel from **2 to 12 months**.
   - During background sweeps, the scheduler identifies brokers whose completion timestamp has expired beyond the configured interval.
   - **Automated Resubmissions**: If the broker supports email unlisting (Email or Both) and Google OAuth is integrated, Gemini automatically drafts the request, dispatches it via the Gmail API on your behalf, and resets the status back to **Pending**.
   - **Manual Resubmissions**: If Google OAuth is disconnected or the broker only supports web forms, Lotos highlights the broker under the dashboard's **Removal Resubmissions Due** alert card, providing quick links to launch opt-out forms or send emails manually.

### Configuration & Manual Triggers
- **Sweep Controls**: Enable or disable background sweeps and adjust the hourly check interval directly from the **Settings & Governance** tab.
- **Resubmit Cycles**: Change the resubmission interval (2, 3, 4, 6, 9, or 12 months) via the dropdown selector in the **Settings & Governance** tab.
- **Immediate Triggers**: Force an immediate inbox and resubmission sweep at any time by clicking the **Trigger Sweep Now** button in Settings or by executing individual resubmissions from the Dashboard.
- **Environment Variables**: The default parameters can be customized in your `.env` file:
  - `SWEEP_INTERVAL_HOURS="12"` (to set the default background check interval)

---

## Privacy & Security

Lotos is built on a foundation of absolute privacy:
- **Local Server Persistence:** To support background sweeps without heavy external database services, Lotos stores a single `state.json` file in the root of your self-hosted server. This file holds your profile coordinates, progress parameters, history logs, and encrypted Gmail API refresh tokens. It never leaves your machine.
- **Local Control:** A complete progress database backup can be downloaded as a JSON file at any time from the Settings tab. You can also completely wipe your footprint from both the browser client and the server config using the **Purge Workspace** option.
