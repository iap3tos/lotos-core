import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini client
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. AI features will be unavailable.");
  }

  // --- AUTHENTICATION & SECURE SESSION CONTROLS ---

  // Helper to parse cookies from headers without external dependencies
  const getCookie = (req: express.Request, name: string): string | null => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";");
    for (const cookie of cookies) {
      const [k, v] = cookie.trim().split("=");
      if (k === name) {
        return decodeURIComponent(v);
      }
    }
    return null;
  };

  // Resolve session secret (or generate ephemeral key)
  let sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    sessionSecret = crypto.randomBytes(32).toString("hex");
    console.warn("WARNING: SESSION_SECRET is not defined in environment variables. Generating ephemeral secret key.");
  }

  // Sign a session payload with SHA-256 HMAC
  const signSession = (payload: any): string => {
    const jsonStr = JSON.stringify(payload);
    const payloadB64 = Buffer.from(jsonStr).toString("base64url");
    const signature = crypto
      .createHmac("sha256", sessionSecret!)
      .update(payloadB64)
      .digest("base64url");
    return `${payloadB64}.${signature}`;
  };

  // Verify and parse a session token
  const verifySession = (cookieValue: string): any | null => {
    try {
      const parts = cookieValue.split(".");
      if (parts.length !== 2) return null;
      const [payloadB64, signature] = parts;
      const expectedSignature = crypto
        .createHmac("sha256", sessionSecret!)
        .update(payloadB64)
        .digest("base64url");
      
      const h1 = crypto.createHash("sha256").update(signature).digest();
      const h2 = crypto.createHash("sha256").update(expectedSignature).digest();
      if (!crypto.timingSafeEqual(h1, h2)) {
        return null;
      }
      
      const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
      const payload = JSON.parse(jsonStr);
      if (payload.expires && payload.expires < Date.now()) {
        return null;
      }
      return payload;
    } catch (e) {
      return null;
    }
  };

  // Auth requirement middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const passcode = process.env.LOTOS_PASSWORD;
    if (!passcode) {
      return next();
    }

    // 1. Check Authorization Bearer header (for automated scripts / cron jobs)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const h1 = crypto.createHash("sha256").update(token).digest();
      const h2 = crypto.createHash("sha256").update(passcode).digest();
      if (crypto.timingSafeEqual(h1, h2)) {
        return next();
      }
    }

    // 2. Check Browser cookie session
    const sessionCookie = getCookie(req, "lotos_session");
    if (sessionCookie) {
      const session = verifySession(sessionCookie);
      if (session) {
        return next();
      }
    }

    res.status(401).json({ error: "Authentication required" });
  };

  // --- PUBLIC API ROUTES ---

  // Get current auth state status
  app.get("/api/auth/status", (req, res) => {
    const passcode = process.env.LOTOS_PASSWORD;
    const authRequired = !!passcode;
    
    let authenticated = false;
    if (authRequired) {
      const sessionCookie = getCookie(req, "lotos_session");
      if (sessionCookie) {
        const session = verifySession(sessionCookie);
        if (session) {
          authenticated = true;
        }
      }
    } else {
      authenticated = true;
    }

    res.json({ authRequired, authenticated });
  });

  // Login endpoint checking password against LOTOS_PASSWORD
  app.post("/api/auth/login", (req, res) => {
    const passcode = process.env.LOTOS_PASSWORD;
    if (!passcode) {
      return res.json({ success: true, message: "Authentication not enabled" });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const h1 = crypto.createHash("sha256").update(password).digest();
    const h2 = crypto.createHash("sha256").update(passcode).digest();
    if (crypto.timingSafeEqual(h1, h2)) {
      const sessionToken = signSession({
        username: "admin",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7-day session
      });

      const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
      const cookieOptions = [
        "HttpOnly",
        "Path=/",
        "SameSite=Lax",
        `Max-Age=${7 * 24 * 60 * 60}`
      ];
      if (isSecure) {
        cookieOptions.push("Secure");
      }

      res.setHeader("Set-Cookie", `lotos_session=${encodeURIComponent(sessionToken)}; ${cookieOptions.join("; ")}`);
      return res.json({ success: true });
    }

    res.status(401).json({ error: "Invalid passcode" });
  });

  // Logout endpoint clearing session cookies
  app.post("/api/auth/logout", (req, res) => {
    res.setHeader(
      "Set-Cookie",
      "lotos_session=; HttpOnly; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    );
    res.json({ success: true });
  });

  // Route path to serve health checks without auth
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // Apply authentication lock to all subsequent API endpoints
  app.use("/api", requireAuth);

  // --- PROTECTED API ROUTES ---

  const getStatePath = () => {
    return process.env.STATE_PATH || path.join(process.cwd(), "state.json");
  };

  const getRedirectUri = (req: express.Request) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    return `${protocol}://${host}/api/auth/google/callback`;
  };

  // Google OAuth URL generation endpoint
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return res.json({ 
        url: null, 
        setupNeeded: true, 
        message: "GOOGLE_CLIENT_ID is not configured on this self-hosted instance." 
      });
    }

    const redirectUri = getRedirectUri(req);
    const scopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly"
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent"
    });

    res.json({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      setupNeeded: false
    });
  });

  // Google OAuth exchange callback endpoint
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Authorization code is missing.");
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = getRedirectUri(req);

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId || "",
          client_secret: clientSecret || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Google exchange error: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();

      // Retrieve user profile information using the access token
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      let userInfo: any = {};
      if (userInfoResponse.ok) {
        userInfo = await userInfoResponse.json();
      }

      // Write token details to local server state file for background sweeps
      try {
        const statePath = getStatePath();
        let currentState: any = {};
        if (fs.existsSync(statePath)) {
          try {
            currentState = JSON.parse(fs.readFileSync(statePath, "utf-8"));
          } catch (e) {
            currentState = {};
          }
        }
        currentState.googleTokenData = tokenData;
        currentState.googleUser = {
          name: userInfo.name || '',
          email: userInfo.email || '',
          picture: userInfo.picture || ''
        };
        fs.writeFileSync(statePath, JSON.stringify(currentState, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write OAuth state in callback:", err);
      }

      res.send(`
        <html>
          <body style="background-color: #050505; color: #e5e5e5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; border: 1px solid #1a1a1a; background: #0a0a0a; padding: 2rem; border-radius: 1rem; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
              <h2 style="color: #d4af37; margin-bottom: 1rem; font-size: 1.5rem;">Lotos Core (Λωτός)</h2>
              <p style="font-size: 0.9rem; color: #888; margin-bottom: 1.5rem;">Authentication successful! Verifying credentials...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    tokenData: ${JSON.stringify(tokenData)},
                    userInfo: ${JSON.stringify(userInfo)}
                  }, '*');
                  setTimeout(() => {
                    window.close();
                  }, 1500);
                } else {
                  window.location.href = '/';
                }
              </script>
              <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #1a1a1a; border-top-color: #d4af37; border-radius: 50%; animation: spin 1s infinite linear;"></div>
              <style>
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
              <p style="font-size: 0.8rem; color: #444; margin-top: 2rem;">You may close this window at any time.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Google OAuth Exchange Error:", error);
      res.status(500).send(`Authentication failed: ${error?.message || error}`);
    }
  });

  // Direct Gmail dispatch proxy endpoint
  app.post("/api/gmail/send-optout", async (req, res) => {
    const { accessToken, to, subject, body } = req.body;
    if (!accessToken) {
      return res.status(401).json({ error: "Google account access token is required." });
    }

    try {
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
      const messageParts = [
        `To: ${to}`,
        "Content-Type: text/plain; charset=UTF-8",
        "MIME-Version: 1.0",
        `Subject: ${utf8Subject}`,
        "",
        body,
      ];
      const message = messageParts.join("\r\n");
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      });

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json();
        throw new Error(`Gmail API report: ${JSON.stringify(errorData)}`);
      }

      const sendData = await sendResponse.json();
      res.json({ success: true, messageId: sendData.id, threadId: sendData.threadId });
    } catch (error: any) {
      console.error("Gmail Sending Broker Error:", error);
      res.status(500).json({ error: error?.message || "Failed to transmit opt-out email." });
    }
  });

  // Direct Gmail matching inbox checker proxy
  app.post("/api/gmail/check-status", async (req, res) => {
    const { accessToken, brokerDomain, brokerName } = req.body;
    if (!accessToken) {
      return res.status(401).json({ error: "Google account access token is required." });
    }

    try {
      const query = `from:${brokerDomain} OR "${brokerName}"`;
      const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`;

      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!searchRes.ok) {
        const err = await searchRes.json();
        throw new Error(`Gmail search query reports: ${JSON.stringify(err)}`);
      }

      const searchData = await searchRes.json();
      const messages = searchData.messages || [];

      const detailedMessages = [];
      for (const msg of messages.slice(0, 3)) {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
          const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

          detailedMessages.push({
            id: msg.id,
            threadId: msg.threadId,
            from: fromHeader,
            subject: subjectHeader,
            date: dateHeader,
            snippet: msgData.snippet || "",
          });
        }
      }

      res.json({
        success: true,
        found: detailedMessages.length > 0,
        emails: detailedMessages,
      });
    } catch (error: any) {
      console.error("Gmail Inbox Audit Error:", error);
      res.status(500).json({ error: error?.message || "Failed to query Gmail inbox." });
    }
  });

  // Client state synchronization endpoints
  app.get("/api/state/sync", (req, res) => {
    try {
      const statePath = getStatePath();
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
        // Securely strip full token details, sending only visual details
        res.json({
          profile: state.profile || null,
          trackingData: state.trackingData || null,
          history: state.history || null,
          googleUser: state.googleUser || null,
          hasGoogleToken: !!state.googleTokenData,
          brokers: state.brokers || null
        });
      } else {
        res.json({ profile: null, trackingData: null, history: null, googleUser: null, hasGoogleToken: false, brokers: null });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load state" });
    }
  });

  app.post("/api/state/sync", (req, res) => {
    try {
      const { profile, trackingData, history, clearGoogleToken, brokers } = req.body;
      const statePath = getStatePath();
      let currentState: any = {};
      
      if (fs.existsSync(statePath)) {
        try {
          currentState = JSON.parse(fs.readFileSync(statePath, "utf-8"));
        } catch (e) {
          currentState = {};
        }
      }
      
      if (profile) currentState.profile = profile;
      if (trackingData) currentState.trackingData = trackingData;
      if (history) currentState.history = history;
      if (brokers) currentState.brokers = brokers;
      
      if (clearGoogleToken) {
        delete currentState.googleTokenData;
        delete currentState.googleUser;
      }
      
      fs.writeFileSync(statePath, JSON.stringify(currentState, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to sync state" });
    }
  });

  // Automated background sweep runner endpoint
  app.get("/api/cron/sweep", async (req, res) => {
    const logs: string[] = [];
    logs.push(`[${new Date().toISOString()}] Initiating background privacy check...`);
    
    try {
      const statePath = getStatePath();
      if (!fs.existsSync(statePath)) {
        return res.status(404).json({ error: "No state configuration found on the server." });
      }
      
      const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
      const tokenData = state.googleTokenData;
      
      if (!tokenData || !tokenData.refresh_token) {
        return res.status(400).json({ error: "No active Google credentials/refresh token found on server." });
      }
      
      // 1. Refresh Gmail access token
      logs.push("Refreshing Google API access token...");
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      
      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        throw new Error(`Failed to exchange refresh token: ${errorText}`);
      }
      
      const refreshedTokens = await refreshResponse.json();
      tokenData.access_token = refreshedTokens.access_token;
      if (refreshedTokens.refresh_token) {
        tokenData.refresh_token = refreshedTokens.refresh_token;
      }
      state.googleTokenData = tokenData;
      logs.push("Tokens updated successfully.");
      
      // 2. Scan for pending data brokers
      const tracking = state.trackingData?.['default'] || {};
      const pendingBrokerIds = Object.keys(tracking).filter(
        brokerId => tracking[brokerId]?.status === 'pending'
      );
      
      if (pendingBrokerIds.length === 0) {
        logs.push("No brokers are currently set to 'pending'. Skipping Gmail sweeps.");
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
        return res.json({ success: true, logs });
      }
      
      logs.push(`Found ${pendingBrokerIds.length} pending requests. Auditing inbox...`);
      
      const { BROKERS_DATABASE } = await import("./src/data/brokers");
      let stateChanged = false;
      const brokersList = state.brokers || BROKERS_DATABASE;
      
      for (const brokerId of pendingBrokerIds) {
        const broker = brokersList.find((b: any) => b.id === brokerId);
        if (!broker) continue;
        
        logs.push(`Searching for responses from ${broker.name} (${broker.domain})...`);
        const query = `from:${broker.domain}`;
        const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=1`;
        
        const searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        
        if (!searchRes.ok) {
          logs.push(`  Error querying Gmail for ${broker.domain}: ${searchRes.statusText}`);
          continue;
        }
        
        const searchData = await searchRes.json();
        const messages = searchData.messages || [];
        
        if (messages.length > 0) {
          const msgId = messages[0].id;
          const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            const snippet = msgData.snippet || "";
            logs.push(`  [ALERT] Received response from ${broker.name}: "${snippet.slice(0, 60)}..."`);
            
            // Mark status as action required
            tracking[brokerId] = {
              status: 'action_required',
              updatedAt: new Date().toISOString(),
              notes: `[Background Sweep] Detected new email response in Gmail inbox: "${snippet}"`
            };
            
            // Log history
            if (!state.history) state.history = [];
            state.history.unshift({
              id: `sweep-log-${Date.now()}-${brokerId}`,
              memberId: 'default',
              memberName: state.profile?.name || 'Me',
              brokerId: broker.id,
              brokerName: broker.name,
              action: 'status_changed',
              fromStatus: 'pending',
              toStatus: 'action_required',
              timestamp: new Date().toISOString(),
              notes: `[Background Sweep] New message response: "${snippet.slice(0, 100)}..."`
            });
            
            stateChanged = true;
          }
        } else {
          logs.push(`  No messages from ${broker.domain} detected.`);
        }
      }
      
      if (stateChanged) {
        state.trackingData['default'] = tracking;
      }
      
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
      logs.push("Sweep operations completed.");
      res.json({ success: true, logs });
      
    } catch (err: any) {
      logs.push(`Critical failure during execution: ${err.message || err}`);
      console.error("Cron sweep error:", err);
      res.status(500).json({ error: err.message || "Background sweep failed", logs });
    }
  });


  // Opt-out email customization custom generator
  app.post("/api/gemini/draft-email", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("Gemini API is not configured on the server. Please define GEMINI_API_KEY.");
      }

      const { brokerName, brokerDomain, userProfile, category, legalFrame } = req.body;
      
      const profileInfo = `
        Name: ${userProfile.name || 'N/A'}
        ${userProfile.latinName ? `Latin / English Name: ${userProfile.latinName}` : ''}
        Email: ${userProfile.email || 'N/A'}
        Alternative Emails: ${userProfile.alternativeEmails?.join(', ') || 'None'}
        Phone: ${userProfile.phone || 'N/A'}
        Location: ${userProfile.city || 'N/A'}, ${userProfile.state || 'N/A'} ${userProfile.postalCode || 'N/A'}
        Address: ${userProfile.address || 'N/A'}
      `;

      const prompt = `
        You are a premium digital privacy expert specializing in data removals and opt-outs.
        Generate a highly professional, legally structured data removal request (suppression/deletion) email to the data broker "${brokerName}" (domain: ${brokerDomain}, category: ${category}).

        Target Legal Framework requested by user: ${legalFrame || 'EU GDPR / Greek Law 4624/2019 / California CCPA'}.
        
        Language Requirement:
        If the data broker's domain ends in ".gr", you MUST write the email subject and body in Greek. Otherwise, you MUST write the email subject and body in English.
        
        Use the following user profile metrics:
        ${profileInfo}

        Ensure the following terms and specifications are listed clearly:
        1. A formal demand under state, federal, or European frameworks (like the General Data Protection Regulation GDPR Article 17 Right to Erasure, Greek GDPR Enforcement Law 4624/2019, or California CCPA depending on the user's location) requiring complete deletion of all marketing, consumer, tracking, and directory files associated with their identity.
           If the language of the email is English, use the "Latin / English Name" (if provided). If "Latin / English Name" is not provided and the Name contains Greek characters, automatically transliterate the Greek Name into Latin characters (like Greeklish) and present both in the email body (e.g. "Greek Name (Latin Transliteration)").
        2. Explicitly demand that they place these identifiers (including their emails, phones, and names) on a permanent suppression list to prevent future re-scraping or re-indexing of their identity.
        3. Request written confirmation within the legal timeframe (usually 30 days under GDPR, or 45 days under CCPA) that deletion has been processed.
        4. State that they should NOT sell, lease, or distribute their data further.
        5. Provide a direct list of the specific values they need to delete, structured for easy search by the broker's compliance team.

        Return a JSON object containing two fields: "subject" and "body".
        Ensure the body has formal formatting, neat clean breaks, and placeholders only where appropriate.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              subject: { type: "STRING", description: "The email subject line" },
              body: { type: "STRING", description: "The full text content of the email" }
            },
            required: ["subject", "body"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text found from Gemini");
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Draft Email Generation Error:", error);
      res.status(500).json({ error: error?.message || "Failed to draft custom email" });
    }
  });

  // AI Privacy Advisor (Chatbot)
  app.post("/api/gemini/advisor", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("Gemini API is not configured on the server. Please define GEMINI_API_KEY.");
      }

      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      // Convert messages to Gemini model format
      // Gemini chats format: { role: 'user' | 'model', parts: [{ text: ... }] }
      const contents = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const systemInstruction = `
        You are "Lotos Guide" (Λωτός), an advanced data-broker survival assistant and compliance coach.
        You are private, friendly, highly responsive, and focused strictly on empowering the user to opt-out, delete, and protect their data from marketing brokers, whitepages directories, and finance trackers. You are fully capable of assisting users inside Greece (Europe) using EU GDPR and Greek GDPR national implementation Law 4624/2019.
        
        Keep your advice highly practical:
        - Provide actual copy-pasteable instructions where needed.
        - Answer clarifying questions on privacy laws (GDPR, Greek Law 4624/2019, CCPA, CPRA, FCRA, etc.).
        - If users ask about opt-outs in Greece, explain that Greek public phone book directories (such as OTE 11888.gr, vrisko.gr, and xo.gr) must comply with unlisting requests under Article 11 of Greek Law 3471/2006 and GDPR Article 17.
        - Tell Greek/EU users that of non-compliance, they hold the right of petitioning the Greek Hellenic Data Protection Authority (HDPA - Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα, dpa.gr).
        - If the user pastes an email response received from a broker (especially lazy rejections or trick verification requirements), help the user analyze it and draft an elegant, firm escalation/followup.
        - Encourage users to persevere, since brokers deliberately design high-friction processes to discourage removals.
        - Do not recommend subscribing to paid removal services. Educate them that using this self-managed app is safer because they keep their personal logs completely local without sharing their passwords or credit cards.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text;
      res.json({ reply });
    } catch (error: any) {
      console.error("Gemini Advisor Query Error:", error);
      res.status(500).json({ error: error?.message || "Advisor was unable to respond" });
    }
  });


  // --- VITE DEV AND PRODUCTION MIDDLEWARES ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Started in development mode with Vite HMR middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Started in production mode serving static dist files.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lotos server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start the Lotos Express server:", err);
});
