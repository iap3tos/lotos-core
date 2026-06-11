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
import { ShieldCheck, Users, Search, Sparkles, Settings, Menu, X, Landmark, FileText, User, LogOut, Mail, AlertTriangle } from 'lucide-react';
import { toGreekUppercase } from './utils/greekUtils';
import Login from './components/Login';

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
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    const previousStatus = updatedTracking['default'][brokerId]?.status || 'not_started';

    updatedTracking['default'][brokerId] = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      notes: notesText
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
    setActiveTab('profiles');
    
    // Purge server state too!
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: initialProfile, trackingData: {}, history: [], brokers: BROKERS_DATABASE, clearGoogleToken: true })
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
              className="p-2.5 bg-[#0a0a0a] text-[#d4af37] hover:text-[#e5c158] rounded-xl border border-[#1a1a1a] hover:border-[#d4af37]/30 font-bold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50"
              aria-label="Go to Home"
            >
              <svg 
                id="lotos-logo-svg"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 flex-shrink-0"
              >
                {/* Stylized Lotus Seed Pod / Fruit outline */}
                <path d="M4 10C4 6 7.5 4 12 4S20 6 20 10C20 13.5 17 18 12 20.5 7 18 4 13.5 4 10Z" />
                <path d="M4 10C4 11.5 7.5 12.5 12 12.5S20 11.5 20 10" />
                {/* Seed holes/details on the flat top face */}
                <circle cx="8" cy="7" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="7" r="1" fill="currentColor" stroke="none" />
                <circle cx="10" cy="9.5" r="1" fill="currentColor" stroke="none" />
                <circle cx="14" cy="9.5" r="1" fill="currentColor" stroke="none" />
              </svg>
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

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('el')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    language === 'el' ? 'bg-[#d4af37] text-black font-extrabold shadow-sm' : 'text-[#666] hover:text-white'
                  }`}
                >
                  ΕΛ
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    language === 'en' ? 'bg-[#d4af37] text-black font-extrabold shadow-sm' : 'text-[#666] hover:text-white'
                  }`}
                >
                  EN
                </button>
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
                    <div className="space-y-2 border-t border-[#1a1a1a]/60 pt-3">
                      {googleUser ? (
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
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-[#666] leading-relaxed">
                            {language === 'el'
                              ? '💡 Συνδεθείτε προαιρετικά με Google για να επιτρέψετε στον Λωτό να στείλει removals ψηφιακά.'
                              : '💡 Optionally connect to Google to authorize Lotos to dispatch removal filings automatically.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              handleStartGoogleAuth();
                              setUserDropdownOpen(false);
                            }}
                            disabled={isAuthorizing}
                            className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#d4af37]/30 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-[11px]"
                          >
                            <Mail size={13} className="text-[#d4af37]" />
                            {isAuthorizing
                              ? (language === 'el' ? 'Επικοινωνία...' : 'Connecting...')
                              : (language === 'el' ? 'Login με Google' : 'Login with Google')}
                          </button>

                          {authError && (
                            <div className="p-2 bg-red-950/10 border border-red-900/30 rounded-lg text-[10px] text-red-400 flex gap-1.5">
                              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                              <span>{authError}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

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
            googleToken={googleToken}
            googleUser={googleUser}
            onGoogleSignOut={handleGoogleSignOut}
            onStartGoogleAuth={handleStartGoogleAuth}
            isAuthorizing={isAuthorizing}
            authError={authError}
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
          />
        )}

      </main>

      {/* Humble literal footer bar */}
      <footer className="bg-[#050505] border-t border-[#1a1a1a] py-6 text-center text-xs text-[#444] font-medium">
        <p>{TRANSLATIONS[language].footerText1}</p>
        <p className="mt-1 text-[10px] text-[#444] uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].footerText2)}</p>
      </footer>

    </div>
  );
}
