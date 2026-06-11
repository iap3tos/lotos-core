import { useState, useEffect } from 'react';
import { BROKERS_DATABASE } from './data/brokers';
import { ProfileDetails, TrackingData, HistoryItem, ChatMessage, RemovalStatus, Broker } from './types';
import Dashboard from './components/Dashboard';
import PersonalProfile from './components/PersonalProfile';
import BrokerList from './components/BrokerList';
import OptOutPanel from './components/OptOutPanel';
import GeminiAdvisor from './components/GeminiAdvisor';
import SettingsPanel from './components/SettingsPanel';
import { TRANSLATIONS, Language } from './data/translations';
import { ShieldCheck, Users, Search, Sparkles, Settings, Menu, X, Landmark, FileText, User, LogOut, Mail, AlertTriangle, Cpu, Key, Lock, ChevronLeft, ChevronRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toGreekUppercase } from './utils/greekUtils';
import Login from './components/Login';
import logoUrl from '@/assets/logo.svg';

const LOCAL_STORAGE_KEY_PROFILES = 'privacyshield_profiles_v1';
const LOCAL_STORAGE_KEY_TRACKING = 'privacyshield_tracking_v1';
const LOCAL_STORAGE_KEY_HISTORY = 'privacyshield_history_v1';
const LOCAL_STORAGE_KEY_CHAT = 'privacyshield_chat_v1';

export default function App() {
  const [activeTab, setActiveTab ] = useState('dashboard');
  const [focusedBrokerId, setFocusedBrokerId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('el');
  const [brokers, setBrokers] = useState<Broker[]>(BROKERS_DATABASE);
  
  // Dashboard Passcode Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  
  // Google Auth states
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; picture?: string } | null>(() => {
    const raw = localStorage.getItem('privacyshield_google_user');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { return null; }
    }
    return null;
  });
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  const handleGoogleAuthSuccess = (tokenData: any, userInfo: any) => {
    setGoogleToken(tokenData.access_token);
    const uInfo = {
      name: userInfo.name || '',
      email: userInfo.email || '',
      picture: userInfo.picture || ''
    };
    setGoogleUser(uInfo);
    localStorage.setItem('privacyshield_google_user', JSON.stringify(uInfo));

    // Auto-update the main profile Name and email if it is of default or empty state
    setProfile(prev => {
      const nameVal = prev.name === 'Me (Main Profile)' || prev.name === 'Εγώ (Κύριο Προφίλ)' || !prev.name ? uInfo.name : prev.name;
      const emailVal = prev.email || uInfo.email;
      const updated = { ...prev, name: nameVal, email: emailVal };
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify([updated]));
      return updated;
    });
  };

  const handleGoogleSignOut = async () => {
    setGoogleToken(null);
    setGoogleUser(null);
    localStorage.removeItem('privacyshield_google_user');
    
    try {
      await fetch('/api/state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearGoogleToken: true })
      });
    } catch (e) {
      console.warn("Failed to clear Google token on server:", e);
    }
  };

  // Hoisted Google Connection states
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Unified Start Google Auth login function
  const handleStartGoogleAuth = async () => {
    setIsAuthorizing(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      
      if (data.setupNeeded) {
        setAuthError(
          language === 'el'
            ? 'Το Google Client ID δεν έχει ρυθμιστεί. Προσθέστε GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET στο αρχείο .env'
            : 'Google Client ID not configured. Please add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET into your .env file.'
        );
        setIsAuthorizing(false);
        return;
      }

      // Open OAuth popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'my_privacy_google_oauth',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!popup) {
        setAuthError(
          language === 'el'
            ? 'Αποκλεισμός αναδυόμενου παραθύρου! Επιτρέψτε τα popups για αυτόν τον ιστότοπο.'
            : 'Popup blocked! Please enable popups for this site to complete authorization.'
        );
        setIsAuthorizing(false);
        return;
      }

      // Single event handler for OAuth callback message
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'OAUTH_AUTH_SUCCESS') {
          const { tokenData, userInfo } = event.data;
          
          handleGoogleAuthSuccess(tokenData, userInfo);
          setIsAuthorizing(false);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (err: any) {
      console.warn("OAuth initialization trigger error:", err);
      setAuthError(err.message || 'Server connection error.');
      setIsAuthorizing(false);
    }
  };

  // Close dropdown on clicking outside
  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-menu-btn')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [userDropdownOpen]);

  // Core States
  const [profile, setProfile] = useState<ProfileDetails>(() => {
    return {
      id: 'default',
      name: '',
      latinName: '',
      email: 'iap3tos@gmail.com',
      phone: '',
      state: 'Attica (EU GDPR)',
      city: 'Athens',
      address: '',
      postalCode: '',
      alternativeEmails: []
    };
  });
  const [trackingData, setTrackingData] = useState<TrackingData>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const [sweepIntervalHours, setSweepIntervalHours] = useState<number>(12);
  const [disableInternalSweep, setDisableInternalSweep] = useState<boolean>(false);
  const [lastSweepTime, setLastSweepTime] = useState<number>(0);
  const [resubmitIntervalMonths, setResubmitIntervalMonths] = useState<number>(3);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [googleClientSecret, setGoogleClientSecret] = useState<string>('');
  const [wizardDismissed, setWizardDismissed] = useState<boolean>(() => {
    return localStorage.getItem('lotos_wizard_dismissed') === 'true';
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Setup Wizard Modal States
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [wizardModalStep, setWizardModalStep] = useState(1);
  const [localGeminiKey, setLocalGeminiKey] = useState('');
  const [localGoogleClientId, setLocalGoogleClientId] = useState('');
  const [localGoogleClientSecret, setLocalGoogleClientSecret] = useState('');
  const [showGeminiToggle, setShowGeminiToggle] = useState(false);
  const [showGoogleToggle, setShowGoogleToggle] = useState(false);
  const [isWizardSaving, setIsWizardSaving] = useState(false);

  const handleOpenCredentialsWizard = () => {
    setLocalGeminiKey(geminiApiKey);
    setLocalGoogleClientId(googleClientId);
    setLocalGoogleClientSecret(googleClientSecret);
    setWizardModalStep(1);
    setIsWizardModalOpen(true);
  };

  const handleSaveWizardCredentials = async () => {
    setIsWizardSaving(true);
    try {
      await handleUpdateSweepSettings(
        sweepIntervalHours,
        disableInternalSweep,
        resubmitIntervalMonths,
        localGeminiKey,
        localGoogleClientId,
        localGoogleClientSecret
      );
      setWizardModalStep(4);
    } catch (err) {
      console.error("Failed to save credentials via wizard:", err);
      alert(language === 'el' ? 'Αποτυχία αποθήκευσης ρυθμίσεων' : 'Failed to save settings');
    } finally {
      setIsWizardSaving(false);
    }
  };

  const handleDismissWizard = () => {
    setWizardDismissed(true);
    localStorage.setItem('lotos_wizard_dismissed', 'true');
  };

  const handleRestoreWizard = () => {
    setWizardDismissed(false);
    localStorage.setItem('lotos_wizard_dismissed', 'false');
    setActiveTab('settings');
  };

  // Hoist initApp so we can call it on mount and after successful authentication
  const initApp = async () => {
    const rawProfiles = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILES);
    const rawTracking = localStorage.getItem(LOCAL_STORAGE_KEY_TRACKING);
    const rawHistory = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
    const rawChat = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT);
    const rawLanguage = localStorage.getItem('privacyshield_lang');

    let currentLang: Language = 'el';
    if (rawLanguage) {
      try {
        currentLang = JSON.parse(rawLanguage) as Language;
      } catch (e) {
        currentLang = 'el';
      }
    }
    setLanguage(currentLang);

    // Try syncing state from server first (Option 2)
    try {
      const res = await fetch('/api/state/sync');
      
      // Handle authentication required status
      if (res.status === 401) {
        setIsAuthenticated(false);
        setIsAuthRequired(true);
        setAuthChecked(true);
        return;
      }

      // Query the global auth requirements setup
      try {
        const authStatusRes = await fetch('/api/auth/status');
        if (authStatusRes.ok) {
          const authData = await authStatusRes.json();
          setIsAuthRequired(authData.authRequired);
          setIsAuthenticated(authData.authenticated);
        }
      } catch (authErr) {
        console.warn("Failed to retrieve auth status details:", authErr);
      }

      if (res.ok) {
        const serverState = await res.json();
        if (serverState.profile) {
          setProfile(serverState.profile);
          setTrackingData(serverState.trackingData || {});
          setHistory(serverState.history || []);
          if (serverState.brokers) {
            setBrokers(serverState.brokers);
            localStorage.setItem('lotos_brokers', JSON.stringify(serverState.brokers));
          } else {
            const localBrokers = localStorage.getItem('lotos_brokers');
            if (localBrokers) {
              try { setBrokers(JSON.parse(localBrokers)); } catch(e) {}
            }
          }
          
          // Sync to local storage
          localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify([serverState.profile]));
          localStorage.setItem(LOCAL_STORAGE_KEY_TRACKING, JSON.stringify(serverState.trackingData || {}));
          localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(serverState.history || []));
          
          if (serverState.settings) {
            setSweepIntervalHours(serverState.settings.sweepIntervalHours ?? 12);
            setDisableInternalSweep(serverState.settings.disableInternalSweep ?? false);
            setResubmitIntervalMonths(serverState.settings.resubmitIntervalMonths ?? 3);
            setGeminiApiKey(serverState.settings.geminiApiKey ?? '');
            setGoogleClientId(serverState.settings.googleClientId ?? '');
            setGoogleClientSecret(serverState.settings.googleClientSecret ?? '');
          }
          if (serverState.lastSweepTime) {
            setLastSweepTime(serverState.lastSweepTime);
          }

          if (serverState.hasGoogleToken && serverState.googleUser) {
            setGoogleUser(serverState.googleUser);
            setGoogleToken("server-managed");
          }
          if (rawChat) setChatHistory(JSON.parse(rawChat));
          setAuthChecked(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load state from server, falling back to local storage:", e);
    }

    // Fallback local storage seeding
    const localBrokers = localStorage.getItem('lotos_brokers');
    if (localBrokers) {
      try { setBrokers(JSON.parse(localBrokers)); } catch(e) {}
    }
    
    const localInterval = localStorage.getItem('lotos_sweep_interval_hours');
    if (localInterval) setSweepIntervalHours(parseInt(localInterval) || 12);
    const localDisable = localStorage.getItem('lotos_disable_internal_sweep');
    if (localDisable) setDisableInternalSweep(localDisable === 'true');
    const localLastSweep = localStorage.getItem('lotos_last_sweep_time');
    if (localLastSweep) setLastSweepTime(parseInt(localLastSweep) || 0);
    const localResubmit = localStorage.getItem('lotos_resubmit_interval_months');
    if (localResubmit) setResubmitIntervalMonths(parseInt(localResubmit) || 3);

    if (rawProfiles && rawTracking && rawHistory) {
      try {
        const parsed = JSON.parse(rawProfiles);
        const mainProfile = Array.isArray(parsed) ? parsed[0] : parsed;
        setProfile(mainProfile || {
          id: 'default',
          name: currentLang === 'el' ? 'Εγώ (Κύριο Προφίλ)' : 'Me (Main Profile)',
          latinName: '',
          email: 'iap3tos@gmail.com',
          phone: '',
          state: 'Attica (EU GDPR)',
          city: 'Athens',
          address: '',
          postalCode: '',
          alternativeEmails: []
        });
      } catch (e) {
        console.error("Failed to parse local profile:", e);
      }
      setTrackingData(JSON.parse(rawTracking));
      setHistory(JSON.parse(rawHistory));
      if (rawChat) setChatHistory(JSON.parse(rawChat));
    } else {
      const initialProfile: ProfileDetails = {
        id: 'default',
        name: currentLang === 'el' ? 'Εγώ (Κύριο Προφίλ)' : 'Me (Main Profile)',
        latinName: '',
        email: 'iap3tos@gmail.com',
        phone: '',
        state: 'Attica (EU GDPR)',
        city: 'Athens',
        address: '',
        postalCode: '',
        alternativeEmails: []
      };

      const initialTracking: TrackingData = {};
      const initialHistory: HistoryItem[] = [];

      setProfile(initialProfile);
      setTrackingData(initialTracking);
      setHistory(initialHistory);
      
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify([initialProfile]));
      localStorage.setItem(LOCAL_STORAGE_KEY_TRACKING, JSON.stringify(initialTracking));
      localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(initialHistory));
      
      // Seed initial sync to server
      fetch('/api/state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: initialProfile, trackingData: initialTracking, history: initialHistory, brokers: BROKERS_DATABASE })
      }).catch(err => console.warn("Failed to seed server state:", err));
    }

    setAuthChecked(true);
  };

  // Trigger loading on app mount
  useEffect(() => {
    initApp();
  }, []);

  // Handle successful passcode authentication
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    initApp();
  };

  // Handle local dashboard passcode session logout
  const handleLotosLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn("Failed to sign out on server:", e);
    }
    // Purge cached states locally
    setGoogleToken(null);
    setGoogleUser(null);
    localStorage.removeItem('privacyshield_google_user');
    setIsAuthenticated(false);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('privacyshield_lang', JSON.stringify(lang));
    setProfile(prev => {
      let nameVal = prev.name;
      if (prev.name === 'Me (Main Profile)' && lang === 'el') {
        nameVal = 'Εγώ (Κύριο Προφίλ)';
      } else if (prev.name === 'Εγώ (Κύριο Προφίλ)' && lang === 'en') {
        nameVal = 'Me (Main Profile)';
      }
      const updated = { ...prev, name: nameVal };
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify([updated]));
      
      // Sync to server
      fetch('/api/state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: updated })
      }).catch(err => console.warn("Failed to sync profile on lang change:", err));

      return updated;
    });
  };

  // Sync state modifications to disk & local server
  const saveProfileToStorage = (updatedProfile: ProfileDetails) => {
    setProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify([updatedProfile]));
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: updatedProfile })
    }).catch(err => console.warn("Failed to sync profile:", err));
  };

  const saveTrackingToStorage = (updatedMap: TrackingData) => {
    setTrackingData(updatedMap);
    localStorage.setItem(LOCAL_STORAGE_KEY_TRACKING, JSON.stringify(updatedMap));
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingData: updatedMap })
    }).catch(err => console.warn("Failed to sync trackingData:", err));
  };

  const saveHistoryToStorage = (updatedLogs: HistoryItem[]) => {
    setHistory(updatedLogs);
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(updatedLogs));
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: updatedLogs })
    }).catch(err => console.warn("Failed to sync history:", err));
  };

  const saveChatToStorage = (updatedChat: ChatMessage[]) => {
    setChatHistory(updatedChat);
    localStorage.setItem(LOCAL_STORAGE_KEY_CHAT, JSON.stringify(updatedChat));
  };

  const saveBrokersToStorage = (updatedBrokers: Broker[]) => {
    setBrokers(updatedBrokers);
    localStorage.setItem('lotos_brokers', JSON.stringify(updatedBrokers));
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brokers: updatedBrokers })
    }).catch(err => console.warn("Failed to sync brokers:", err));
  };

  const handleUpdateSweepSettings = (
    interval: number, 
    disabled: boolean, 
    resubmitInterval?: number,
    geminiKey?: string,
    clientId?: string,
    clientSecret?: string
  ) => {
    setSweepIntervalHours(interval);
    setDisableInternalSweep(disabled);
    const activeResubmit = resubmitInterval !== undefined ? resubmitInterval : resubmitIntervalMonths;
    setResubmitIntervalMonths(activeResubmit);
    localStorage.setItem('lotos_sweep_interval_hours', String(interval));
    localStorage.setItem('lotos_disable_internal_sweep', String(disabled));
    localStorage.setItem('lotos_resubmit_interval_months', String(activeResubmit));

    const updatedGeminiKey = geminiKey !== undefined ? geminiKey : geminiApiKey;
    const updatedClientId = clientId !== undefined ? clientId : googleClientId;
    const updatedClientSecret = clientSecret !== undefined ? clientSecret : googleClientSecret;

    setGeminiApiKey(updatedGeminiKey);
    setGoogleClientId(updatedClientId);
    setGoogleClientSecret(updatedClientSecret);
    
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        settings: {
          sweepIntervalHours: interval,
          disableInternalSweep: disabled,
          resubmitIntervalMonths: activeResubmit,
          geminiApiKey: updatedGeminiKey,
          googleClientId: updatedClientId,
          googleClientSecret: updatedClientSecret
        }
      })
    })
    .then(async (res) => {
      if (res.ok) {
        const syncRes = await fetch('/api/state/sync');
        if (syncRes.ok) {
          const syncState = await syncRes.json();
          if (syncState.lastSweepTime) {
            setLastSweepTime(syncState.lastSweepTime);
            localStorage.setItem('lotos_last_sweep_time', String(syncState.lastSweepTime));
          }
        }
      }
    })
    .catch(err => console.warn("Failed to sync sweep settings:", err));
  };

  // --- ACTIONS HANDLERS ---

  const handleUpdateProfile = (partial: Partial<ProfileDetails>) => {
    const updated = { ...profile, ...partial };
    saveProfileToStorage(updated);
  };

  // Central State Progress Modifier
  const handleUpdateStatus = (
    brokerId: string, 
    newStatus: RemovalStatus, 
    notesText: string,
    actionType: 'sent_email' | 'form_visited' | 'status_changed'
  ) => {
    const broker = brokers.find(b => b.id === brokerId);
    if (!broker) return;

    // 1. Update Tracking record
    const updatedTracking = { ...trackingData };
    if (!updatedTracking['default']) {
      updatedTracking['default'] = {};
    }

    const previousState = updatedTracking['default'][brokerId];
    const previousStatus = previousState?.status || 'not_started';

    const completedAtVal = newStatus === 'completed'
      ? (previousStatus === 'completed' ? previousState?.completedAt || new Date().toISOString() : new Date().toISOString())
      : undefined;

    updatedTracking['default'][brokerId] = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      notes: notesText,
      completedAt: completedAtVal
    };
    saveTrackingToStorage(updatedTracking);

    // 2. Add history timelines block
    const historyItem: HistoryItem = {
      id: `h-log-${Date.now()}`,
      memberId: 'default',
      memberName: profile.name,
      brokerId: broker.id,
      brokerName: broker.name,
      action: actionType,
      fromStatus: previousStatus,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      notes: notesText || undefined
    };

    const updatedHistory = [historyItem, ...history];
    saveHistoryToStorage(updatedHistory);
  };

  // Chat History operations
  const handleAddChatMessage = (msg: ChatMessage) => {
    const updated = [...chatHistory, msg];
    saveChatToStorage(updated);
  };

  const handleClearChatHistory = () => {
    saveChatToStorage([]);
  };

  // Backup Integration
  const handleImportBackup = (
    importedProfile: ProfileDetails, 
    importedTracking: TrackingData, 
    importedHistory: HistoryItem[]
  ) => {
    saveProfileToStorage(importedProfile);
    saveTrackingToStorage(importedTracking);
    saveHistoryToStorage(importedHistory);
  };

  const handlePurgeAllLocalDatabases = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_PROFILES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TRACKING);
    localStorage.removeItem(LOCAL_STORAGE_KEY_HISTORY);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CHAT);
    localStorage.removeItem('lotos_brokers');
    localStorage.removeItem('lotos_sweep_interval_hours');
    localStorage.removeItem('lotos_disable_internal_sweep');
    localStorage.removeItem('lotos_last_sweep_time');
    localStorage.removeItem('lotos_resubmit_interval_months');
    localStorage.removeItem('lotos_wizard_dismissed');

    const initialProfile = {
      id: 'default',
      name: language === 'el' ? 'Εγώ (Κύριο Προφίλ)' : 'Me (Main Profile)',
      email: 'iap3tos@gmail.com',
      phone: '',
      state: 'Attica (EU GDPR)',
      city: 'Athens',
      address: '',
      postalCode: '',
      alternativeEmails: []
    };

    setProfile(initialProfile);
    setTrackingData({});
    setHistory([]);
    setChatHistory([]);
    setBrokers(BROKERS_DATABASE);
    setSweepIntervalHours(12);
    setDisableInternalSweep(false);
    setLastSweepTime(0);
    setResubmitIntervalMonths(3);
    setGeminiApiKey('');
    setGoogleClientId('');
    setGoogleClientSecret('');
    setWizardDismissed(false);
    setActiveTab('profiles');
    
    // Purge server state too!
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        profile: initialProfile, 
        trackingData: {}, 
        history: [], 
        brokers: BROKERS_DATABASE, 
        clearGoogleToken: true,
        settings: {
          sweepIntervalHours: 12,
          disableInternalSweep: false,
          resubmitIntervalMonths: 3,
          geminiApiKey: '',
          googleClientId: '',
          googleClientSecret: ''
        }
      })
    }).catch(err => console.warn("Failed to purge server state:", err));
  };

  // Calculate global completed deletion counts
  const totalCompletedCount = Object.values(trackingData['default'] || {}).filter((st: any) => st.status === 'completed').length;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-[#d4af37]"></div>
      </div>
    );
  }

  if (isAuthRequired && !isAuthenticated) {
    return <Login language={language} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col antialiased">
      
      {/* Upper Brand Safety bar */}
      <header className="sticky top-0 z-40 bg-[#050505] text-[#e5e5e5] border-b border-[#1a1a1a] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8 md:gap-12">
            
            {/* Branding launcher logo */}
            <button
              id="lotos-brand-btn"
              onClick={() => { setActiveTab('dashboard'); setFocusedBrokerId(null); }}
              className="transition-all cursor-pointer focus:outline-none flex items-center justify-center hover:opacity-80"
              aria-label="Go to Home"
            >
              <img 
                src={logoUrl} 
                id="lotos-logo-svg"
                className="w-8 h-8 flex-shrink-0 object-contain"
                alt="Lotos Logo" 
              />
            </button>

            {/* Desktop Navigation elements */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('dashboard'); setFocusedBrokerId(null); }}
                className={`px-3 py-2 rounded-lg transition-all border ${
                  activeTab === 'dashboard' 
                    ? 'bg-[#111] text-[#d4af37] border-[#d4af37]/30 border-l-2 border-l-[#d4af37]' 
                    : 'text-[#666] hover:text-white hover:bg-[#111]/50 border-transparent'
                }`}
              >
                {TRANSLATIONS[language].tabOverview}
              </button>

              <button
                onClick={() => { setActiveTab('brokers'); setFocusedBrokerId(null); }}
                className={`px-3 py-2 rounded-lg transition-all border ${
                  activeTab === 'brokers' 
                    ? 'bg-[#111] text-[#d4af37] border-[#d4af37]/20 border-l-2 border-l-[#d4af37]' 
                    : 'text-[#666] hover:text-white hover:bg-[#111]/50 border-transparent'
                }`}
              >
                {TRANSLATIONS[language].tabSuppression}
              </button>



              {geminiApiKey && (
                <button
                  onClick={() => { setActiveTab('advisor'); setFocusedBrokerId(null); }}
                  className={`px-3 py-2 rounded-lg transition-all border ${
                    activeTab === 'advisor' 
                      ? 'bg-[#111] text-[#d4af37] border-[#d4af37]/20 border-l-2 border-l-[#d4af37]' 
                      : 'text-[#666] hover:text-white hover:bg-[#111]/50 border-transparent'
                  }`}
                >
                  {TRANSLATIONS[language].tabAdvisor}
                </button>
              )}

              <button
                onClick={() => { setActiveTab('settings'); setFocusedBrokerId(null); }}
                className={`px-3 py-2 rounded-lg transition-all border ${
                  activeTab === 'settings' 
                    ? 'bg-[#111] text-[#d4af37] border-[#d4af37]/20 border-l-2 border-l-[#d4af37]' 
                    : 'text-[#666] hover:text-white hover:bg-[#111]/50 border-transparent'
                }`}
              >
                {TRANSLATIONS[language].tabSettings}
              </button>
            </nav>

            <div className="flex items-center gap-3.5">
              {/* Quick counters */}
              <div className="hidden lg:flex items-center gap-3 border-l border-[#1a1a1a] pl-4 text-xs font-semibold text-[#666]">
                <span>{TRANSLATIONS[language].deletedVectors}: <strong className="text-[#d4af37] font-bold font-mono">{totalCompletedCount}</strong></span>
              </div>



              {/* User Dropdown / Authenticated Context */}
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer bg-[#0a0a0a] ${
                    activeTab === 'profiles' ? 'border-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.15)]' : 'border-[#1a1a1a] hover:border-[#d4af37]/30'
                  }`}
                  aria-label="Toggle user menu"
                >
                  {googleUser && googleUser.picture ? (
                    <img 
                      src={googleUser.picture} 
                      alt={googleUser.name} 
                      className="w-6 h-6 rounded-full border border-[#1a1a1a]" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[#d4af37] bg-[#111]">
                      <User size={12} />
                    </div>
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-72 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl shadow-2xl z-50 p-4 space-y-4 text-xs text-[#e5e5e5] animate-fade-in">
                    
                    {/* User profile details header */}
                    <div className="flex items-center gap-3 border-b border-[#1a1a1a] pb-3">
                      {googleUser && googleUser.picture ? (
                        <img 
                          src={googleUser.picture} 
                          alt={googleUser.name} 
                          className="w-10 h-10 rounded-full border border-[#1a1a1a]" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-[#d4af37] font-serif font-black text-sm">
                          👤
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white truncate">
                          {googleUser ? googleUser.name : (language === 'el' ? 'Τοπικό Προφίλ' : 'Local Identity')}
                        </h4>
                        <p className="text-[10px] text-[#555] truncate font-mono">
                          {googleUser ? googleUser.email : (language === 'el' ? 'Χωρίς Σύνδεση Google' : 'No Google Connection')}
                        </p>
                      </div>
                    </div>

                    {/* Navigation shortcut to Manage Profiles page */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('profiles');
                          setUserDropdownOpen(false);
                          setFocusedBrokerId(null);
                        }}
                        className={`w-full text-left font-semibold py-2 px-3 rounded-lg flex items-center gap-2.5 transition-all text-xs border ${
                          activeTab === 'profiles'
                            ? 'bg-[#111] text-[#d4af37] border-[#d4af37]/20 border-l-2 border-l-[#d4af37]'
                            : 'text-[#888] hover:text-white hover:bg-[#111]/50 border-transparent hover:border-[#1a1a1a]'
                        }`}
                      >
                        <User size={13} className="text-[#d4af37]" />
                        <span>{language === 'el' ? '👤 Το Προφίλ μου' : '👤 My Profile'}</span>
                      </button>
                    </div>

                    {/* Google Connection status and Actions */}
                    {googleUser && (
                      <div className="space-y-2 border-t border-[#1a1a1a]/60 pt-3">
                        <div className="space-y-2">
                          <div className="p-2 bg-emerald-950/10 border border-emerald-950/30 rounded-lg text-[10px] text-emerald-400 flex items-center gap-1.5 leading-tight">
                            <ShieldCheck size={12} className="shrink-0" />
                            <span>{language === 'el' ? 'Έχει εξουσιοδοτηθεί το Gmail' : 'Gmail integration authorized'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleGoogleSignOut();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full bg-[#111] hover:bg-[#111] border border-[#1a1a1a] hover:border-red-950/40 text-[11px] text-[#888] hover:text-red-400 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <LogOut size={12} />
                            {language === 'el' ? 'Αποσύνδεση Google' : 'Sign Out Google'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dashboard Logout (Passcode session) */}
                    {isAuthRequired && (
                      <div className="border-t border-[#1a1a1a]/60 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            handleLotosLogout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full bg-[#111] hover:bg-neutral-900 border border-[#1a1a1a] hover:border-red-950/40 text-[11px] text-[#888] hover:text-red-400 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <LogOut size={12} />
                          {language === 'el' ? 'Αποσύνδεση Λωτού' : 'Sign Out Dashboard'}
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu trigger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#666] hover:text-white hover:bg-[#111] transition-all focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile slide menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1a1a1a] bg-[#0a0a0a] block pt-1.5 pb-3">
            <div className="px-2 space-y-1 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); setFocusedBrokerId(null); }}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-[#666] hover:bg-[#111]/80 hover:text-white"
              >
                {TRANSLATIONS[language].tabOverview}
              </button>
              <button
                onClick={() => { setActiveTab('brokers'); setMobileMenuOpen(false); setFocusedBrokerId(null); }}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-[#666] hover:bg-[#111]/80 hover:text-white"
              >
                {TRANSLATIONS[language].tabSuppression}
              </button>

              {geminiApiKey && (
                <button
                  onClick={() => { setActiveTab('advisor'); setMobileMenuOpen(false); setFocusedBrokerId(null); }}
                  className="w-full text-left block px-3 py-2.5 rounded-lg text-[#666] hover:bg-[#111]/80 hover:text-white"
                >
                  {TRANSLATIONS[language].tabAdvisor}
                </button>
              )}

              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); setFocusedBrokerId(null); }}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-[#666] hover:bg-[#111]/80 hover:text-white"
              >
                {TRANSLATIONS[language].tabSettings}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container Stage viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render Tab components */}
        {activeTab === 'dashboard' && (
          <Dashboard
            brokers={brokers}
            profile={profile}
            trackingData={trackingData}
            history={history}
            onNavigate={(tab) => { setActiveTab(tab); setFocusedBrokerId(null); }}
            language={language}
            googleUser={googleUser}
            resubmitIntervalMonths={resubmitIntervalMonths}
            onUpdateStatus={handleUpdateStatus}
            geminiApiKey={geminiApiKey}
            googleClientId={googleClientId}
            googleClientSecret={googleClientSecret}
            wizardDismissed={wizardDismissed}
            onDismissWizard={handleDismissWizard}
            onOpenWizard={handleOpenCredentialsWizard}
          />
        )}

        {activeTab === 'brokers' && (
          focusedBrokerId ? (
            (() => {
              const b = brokers.find(broker => broker.id === focusedBrokerId);
              if (!b) return null;
              
              const mState = trackingData['default']?.[b.id] || { status: 'not_started', notes: '', updatedAt: '' };
              
              return (
                <OptOutPanel
                  broker={b}
                  activeMember={profile}
                  currentState={mState}
                  onUpdateStatus={handleUpdateStatus}
                  onBack={() => setFocusedBrokerId(null)}
                  language={language}
                  googleToken={googleToken}
                />
              );
            })()
          ) : (
            <BrokerList
              brokers={brokers}
              activeMember={profile}
              trackingData={trackingData}
              onSelectBroker={(id) => setFocusedBrokerId(id)}
              language={language}
            />
          )
        )}

        {activeTab === 'profiles' && (
          <PersonalProfile
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            language={language}
            onLanguageChange={handleLanguageChange}
            googleToken={googleToken}
            googleUser={googleUser}
            onGoogleSignOut={handleGoogleSignOut}
            onStartGoogleAuth={handleStartGoogleAuth}
            isAuthorizing={isAuthorizing}
            authError={authError}
            wizardDismissed={wizardDismissed}
            onRestoreWizard={handleRestoreWizard}
          />
        )}

        {activeTab === 'advisor' && (
          <GeminiAdvisor
            chatHistory={chatHistory}
            onAddMessage={handleAddChatMessage}
            onClearHistory={handleClearChatHistory}
            language={language}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            profile={profile}
            trackingData={trackingData}
            history={history}
            onImportBackup={handleImportBackup}
            onPurgeData={handlePurgeAllLocalDatabases}
            language={language}
            isAuthRequired={isAuthRequired}
            brokers={brokers}
            onUpdateBrokers={saveBrokersToStorage}
            sweepIntervalHours={sweepIntervalHours}
            disableInternalSweep={disableInternalSweep}
            lastSweepTime={lastSweepTime}
            onUpdateSweepSettings={handleUpdateSweepSettings}
            resubmitIntervalMonths={resubmitIntervalMonths}
            geminiApiKey={geminiApiKey}
            googleClientId={googleClientId}
            googleClientSecret={googleClientSecret}
            onOpenWizard={handleOpenCredentialsWizard}
          />
        )}

      </main>

      {/* Humble literal footer bar */}
      <footer className="bg-[#050505] border-t border-[#1a1a1a] py-6 text-center text-xs text-[#444] font-medium">
        <p>{TRANSLATIONS[language].footerText1}</p>
        <p className="mt-1 text-[10px] text-[#444] uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].footerText2)}</p>
      </footer>

      {/* Step-by-Step Credentials Onboarding Wizard Modal */}
      {isWizardModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="credentials-wizard-modal">
          <div className="bg-[#0a0a0a] border border-[#d4af37]/30 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative font-sans">
            
            {/* Header / Dismiss */}
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#d4af37]/10 text-[#d4af37] rounded-lg">
                  <Sparkles size={16} />
                </span>
                <h3 className="text-sm font-serif text-white uppercase tracking-wider">
                  {toGreekUppercase(language === 'el' ? 'Οδηγός Εγκατάστασης API' : 'API Setup Wizard')}
                </h3>
              </div>
              <button 
                onClick={() => setIsWizardModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1a1a1a]/60">
              {[
                { label_el: 'Εισαγωγή', label_en: 'Intro' },
                { label_el: 'Gemini AI', label_en: 'Gemini AI' },
                { label_el: 'Google API', label_en: 'Google API' },
                { label_el: 'Ολοκλήρωση', label_en: 'Finish' }
              ].map((stepObj, idx) => {
                const stepNum = idx + 1;
                const isCompleted = wizardModalStep > stepNum;
                const isActive = wizardModalStep === stepNum;
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isCompleted 
                        ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' 
                        : isActive 
                          ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]' 
                          : 'bg-[#111] text-[#666] border border-[#1a1a1a]'
                    }`}>
                      {stepNum}
                    </span>
                    <span className={`text-[10px] font-bold tracking-wider uppercase hidden sm:inline ${
                      isActive ? 'text-[#d4af37]' : 'text-[#666]'
                    }`}>
                      {toGreekUppercase(language === 'el' ? stepObj.label_el : stepObj.label_en)}
                    </span>
                    {idx < 3 && <span className="text-[#333] hidden sm:inline">&rarr;</span>}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="py-2 text-xs space-y-4">
              
              {/* STEP 1: Welcome & Overview */}
              {wizardModalStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
                    {toGreekUppercase(language === 'el' ? 'Καλώς ορίσατε στον Οδηγό Εγκατάστασης' : 'Welcome to the Setup Wizard')}
                  </h4>
                  <p className="text-[#888] leading-relaxed font-sans">
                    {language === 'el'
                      ? 'Αυτός ο οδηγός θα σας βοηθήσει να συνδέσετε τις απαραίτητες υπηρεσίες για να ξεκλειδώσετε τις πλήρεις δυνατότητες του Λωτού.'
                      : 'This interactive wizard will guide you through connecting the necessary external services to activate all capabilities.'}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-sans">
                    <div className="bg-[#111] border border-[#1a1a1a] p-3 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-[#d4af37] font-bold">
                        <Cpu size={14} />
                        <span>Gemini AI (Optional)</span>
                      </div>
                      <p className="text-[10px] text-[#666] leading-relaxed">
                        {language === 'el'
                          ? 'Ενεργοποιεί τον Compliance Advisor AI chat και επιτρέπει τη σύνταξη έξυπνων απαντήσεων.'
                          : 'Powers the Compliance Advisor AI chat and auto-drafts custom deletion emails.'}
                      </p>
                    </div>

                    <div className="bg-[#111] border border-[#1a1a1a] p-3 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Mail size={14} />
                        <span>Google Gmail (Optional)</span>
                      </div>
                      <p className="text-[10px] text-[#666] leading-relaxed">
                        {language === 'el'
                          ? 'Επιτρέπει την αυτόματη αποστολή email διαγραφής και το σκανάρισμα απαντήσεων.'
                          : 'Enables fully automated sweeps to dispatch deletions and monitor inbox replies.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Gemini AI Key Setup */}
              {wizardModalStep === 2 && (
                <div className="space-y-3.5 font-sans">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <Cpu size={16} className="text-[#d4af37]" />
                    {toGreekUppercase(language === 'el' ? 'Βήμα 2: Gemini AI API Key' : 'Step 2: Gemini AI API Key')}
                  </h4>
                  <p className="text-[#888] leading-relaxed">
                    {language === 'el'
                      ? 'Για να ενεργοποιήσετε τον AI Σύμβουλο Συμμόρφωσης, χρειάζεστε ένα Gemini API Key. Μπορείτε να εκδώσετε ένα εντελώς δωρεάν ($0) από το Google AI Studio.'
                      : 'To communicate with the AI Compliance Advisor, configure your Gemini token. You can fetch one at zero cost from the Google AI Studio.'}
                  </p>
                  
                  <div className="bg-black/30 border border-[#1a1a1a] p-3 rounded-lg text-[10px] text-gray-400 leading-relaxed space-y-1">
                    <p>1. {language === 'el' ? 'Επισκεφθείτε το: https://aistudio.google.com' : 'Visit: https://aistudio.google.com'}</p>
                    <p>2. {language === 'el' ? 'Συνδεθείτε με τον Google λογαριασμό σας και πατήστε "Get API Key".' : 'Authenticate and select "Get API Key".'}</p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">
                      {toGreekUppercase(language === 'el' ? 'Κλειδί API Gemini' : 'Gemini API Key')}
                    </label>
                    <div className="relative">
                      <input
                        type={showGeminiToggle ? 'text' : 'password'}
                        value={localGeminiKey}
                        onChange={(e) => setLocalGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/40 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiToggle(!showGeminiToggle)}
                        className="absolute right-3 top-2.5 text-[#555] hover:text-white cursor-pointer"
                      >
                        {showGeminiToggle ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Google Client Credentials Setup */}
              {wizardModalStep === 3 && (
                <div className="space-y-3.5 font-sans">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <Key size={16} className="text-blue-400" />
                    {toGreekUppercase(language === 'el' ? 'Βήμα 3: Google API Gateway' : 'Step 3: Google API Credentials')}
                  </h4>
                  <p className="text-[#888] leading-relaxed">
                    {language === 'el'
                      ? 'Για να αυτοματοποιήσετε την αποστολή email διαγραφής μέσω Gmail, πρέπει να δημιουργήσετε μια εφαρμογή στο Google Cloud Console και να πάρετε Client ID και Secret.'
                      : 'To dispatch automated sweeps directly from your Gmail, set up your Google Cloud Developer Console credentials.'}
                  </p>

                  <div className="bg-black/30 border border-[#1a1a1a] p-3 rounded-lg text-[10px] text-gray-400 leading-relaxed space-y-1">
                    <p>• {language === 'el' ? 'Authorized Redirect URI: http://localhost:3000/api/auth/google/callback' : 'Authorized Redirect URI: http://localhost:3000/api/auth/google/callback'}</p>
                    <p>• {language === 'el' ? 'Ενεργοποιήστε το Gmail API στη βιβλιοθήκη APIs.' : 'Enable Gmail API in Google Cloud APIs Library.'}</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">
                        GOOGLE CLIENT ID
                      </label>
                      <input
                        type="text"
                        value={localGoogleClientId}
                        onChange={(e) => setLocalGoogleClientId(e.target.value)}
                        placeholder="123456-abcdef.apps.googleusercontent.com"
                        className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/40 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">
                        GOOGLE CLIENT SECRET
                      </label>
                      <div className="relative">
                        <input
                          type={showGoogleToggle ? 'text' : 'password'}
                          value={localGoogleClientSecret}
                          onChange={(e) => setLocalGoogleClientSecret(e.target.value)}
                          placeholder="GOCSPX-..."
                          className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/40 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleToggle(!showGoogleToggle)}
                          className="absolute right-3 top-2.5 text-[#555] hover:text-white cursor-pointer"
                        >
                          {showGoogleToggle ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Save Success & Finish */}
              {wizardModalStep === 4 && (
                <div className="space-y-4 text-center py-4 font-sans">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 flex items-center justify-center mx-auto text-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white font-serif">
                      {language === 'el' ? 'Η Εγκατάσταση Ολοκληρώθηκε!' : 'Configuration Completed!'}
                    </h4>
                    <p className="text-[#888] leading-relaxed max-w-sm mx-auto">
                      {language === 'el'
                        ? 'Τα κλειδιά σας συγχρονίστηκαν επιτυχώς με τον τοπικό διακομιστή του Λωτού.'
                        : 'Your secure credentials have been successfully synced to the local Lotos database.'}
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto pt-2 space-y-2 font-mono text-[10px] text-left">
                    <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-1.5">
                      <span className="text-[#666]">Gemini AI Gateway:</span>
                      <span className={localGeminiKey ? 'text-emerald-400 font-bold' : 'text-[#666]'}>
                        {localGeminiKey ? 'ACTIVE' : 'MISSING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#666]">Google API Gateway:</span>
                      <span className={(localGoogleClientId && localGoogleClientSecret) ? 'text-emerald-400 font-bold' : 'text-[#666]'}>
                        {(localGoogleClientId && localGoogleClientSecret) ? 'ACTIVE' : 'MISSING'}
                      </span>
                    </div>
                  </div>

                  {/* Google Account Connection status / button */}
                  <div className="max-w-xs mx-auto border-t border-[#1a1a1a] pt-3.5 mt-2 space-y-3">
                    <h5 className="text-[10px] font-bold text-white uppercase tracking-wider text-left">
                      {language === 'el' ? 'Σύνδεση Λογαριασμού Google' : 'Google Account Connection'}
                    </h5>
                    
                    {googleUser && googleToken ? (
                      <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-lg p-2.5 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 size={14} className="shrink-0" />
                        <div className="text-left truncate">
                          <span className="block font-bold text-white">CONNECTED</span>
                          <span className="text-gray-400 select-all">{googleUser.email}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-left">
                        <p className="text-[10px] text-gray-500 leading-normal font-sans">
                          {language === 'el'
                            ? 'Απαιτείται σύνδεση με λογαριασμό Google για την αυτοματοποίηση των email και τη σάρωση απαντήσεων.'
                            : 'Connecting your Google account is required to scan replies and automate deletion emails.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleStartGoogleAuth}
                          disabled={isAuthorizing}
                          className="w-full bg-[#35B9F5] hover:bg-[#20a3dd] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                        >
                          {isAuthorizing ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              {language === 'el' ? 'Σύνδεση...' : 'Connecting...'}
                            </>
                          ) : (
                            <>
                              {language === 'el' ? 'Σύνδεση με Google Account' : 'Connect Google Account'}
                            </>
                          )}
                        </button>
                        {authError && (
                          <p className="text-[10px] text-red-400 leading-normal font-semibold font-sans">
                            ⚠️ {authError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
              
              {/* Left / Back Button */}
              {wizardModalStep > 1 && wizardModalStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardModalStep(wizardModalStep - 1)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#888] hover:text-white bg-[#111] border border-[#1a1a1a] py-2 px-4 rounded-lg transition-all cursor-pointer font-sans"
                >
                  <ChevronLeft size={13} /> {toGreekUppercase(language === 'el' ? 'Πίσω' : 'Back')}
                </button>
              ) : (
                <div></div> // spacing filler
              )}

              {/* Right Button */}
              {wizardModalStep === 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWizardModalOpen(false)}
                    className="text-xs font-semibold text-[#888] hover:text-white bg-[#111] border border-[#1a1a1a] py-2 px-4 rounded-lg transition-all cursor-pointer font-sans"
                  >
                    {toGreekUppercase(language === 'el' ? 'Κλείσιμο' : 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardModalStep(2)}
                    className="flex items-center gap-1.5 bg-[#d4af37] text-black text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer font-sans"
                  >
                    {toGreekUppercase(language === 'el' ? 'Επόμενο' : 'Next')} <ChevronRight size={13} />
                  </button>
                </div>
              ) : wizardModalStep === 2 ? (
                <button
                  type="button"
                  onClick={() => setWizardModalStep(3)}
                  className="flex items-center gap-1.5 bg-[#d4af37] text-black text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer font-sans"
                >
                  {toGreekUppercase(language === 'el' ? 'Επόμενο' : 'Next')} <ChevronRight size={13} />
                </button>
              ) : wizardModalStep === 3 ? (
                <button
                  type="button"
                  disabled={isWizardSaving}
                  onClick={handleSaveWizardCredentials}
                  className="flex items-center gap-1.5 bg-[#d4af37] disabled:bg-[#d4af37]/50 text-black text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer font-sans"
                >
                  {isWizardSaving 
                    ? toGreekUppercase(language === 'el' ? 'Αποθήκευση...' : 'Saving...') 
                    : toGreekUppercase(language === 'el' ? 'Αποθήκευση & Τέλος' : 'Save & Finish')
                  }
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsWizardModalOpen(false)}
                  className="w-full bg-[#d4af37] text-black text-xs font-bold py-2 px-4 rounded-lg transition-all text-center cursor-pointer font-sans uppercase tracking-wider text-[10px]"
                >
                  {toGreekUppercase(language === 'el' ? 'Τέλος' : 'Finish')}
                </button>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
