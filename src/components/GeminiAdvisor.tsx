import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { Send, Sparkles, Loader2, RefreshCw, Compass, HelpCircle, ShieldQuestion, Cpu, CheckCircle, Key, ChevronDown, ChevronUp, Layers, Mail } from 'lucide-react';
import { toGreekUppercase } from '../utils/greekUtils';

interface GeminiAdvisorProps {
  chatHistory: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
  language: Language;
}

export const GUIDE_TRANSLATIONS = {
  el: {
    guideTitle: "Οδηγός Αυτο-φιλοξενίας & Σύνδεσης Gemini API",
    guideSubtitle: "Διαμορφώστε τον προσωπικό σας διακομιστή με δικό σας Gemini API κλειδί με 100% ιδιωτικότητα.",
    aiOnline: "ΠΥΛΗ AI: ΣΕ ΛΕΙΤΟΥΡΓΙΑ",
    aiOffline: "ΠΥΛΗ AI: ΕΚΤΟΣ ΛΕΙΤΟΥΡΓΙΑΣ (ΑΠΑΙΤΕΙΤΑΙ ΡΥΘΜΙΣΗ)",
    aiChecking: "ΕΛΕΓΧΟΣ ΣΥ-ΝΔΕΣΗΣ AI...",
    hideGuide: "Απόκρυψη Οδηγού",
    showGuide: "Εμφάνιση Οδηγού",
    q1: "Θα λειτουργήσει το Google Integration (Gmail) σε self-hosted περιβάλλον;",
    a1: "Ναι! Η σύνδεση Google OAuth (Gmail) γίνεται αποκλειστικά για να αποστέλλονται τα email από το δικό σας inbox. Δεν χρησιμοποιείται κανένα API του δημιουργού για αυτό, διασφαλίζοντας 100% ιδιωτικότητα. Η επικοινωνία ολοκληρώνεται απευθείας ανάμεσα στον τοπικό σας διακομιστή και τις υπηρεσίες Google, χωρίς καμία μεσολάβηση.",
    q2: "Εάν έχω δωρεάν Google λογαριασμό (όχι Workspace), θα λειτουργήσει;",
    a2: "Απολύτως! Ένας απλός, δωρεάν λογαριασμός Gmail (@gmail.com) λειτουργεί τέλεια τόσο για την εύρεση απαντήσεων όσο και για την αποστολή των email διαγραφής. Δεν χρειάζεται καμία πληρωμένη συνδρομή Google Workspace ή Gemini Advanced.",
    q3: "Πώς μπορώ να συνδέσω το δικό μου Gemini API Key;",
    a3_step1: "1. Επισκεφθείτε το Google AI Studio (https://aistudio.google.com).",
    a3_step2: "2. Συνδεθείτε με οποιοδήποτε δωρεάν λογαριασμό Google και πατήστε 'Get API Key' για να δημιουργήσετε ένα κλειδί.",
    a3_step3: "3. Η δωρεάν έκδοση προσφέρει γενναιόδωρα όρια (15 ερωτήσεις το λεπτό) εντελώς δωρεάν ($0/μήνα) και λειτουργεί άψογα με το 'gemini-3.5-flash'.",
    a3_step4: "4. Προσθέστε το κλειδί στο αρχείο .env της self-hosted εφαρμογής σας: GEMINI_API_KEY=το_κλειδί_σας και επανεκκινήστε τον διακομιστή.",
  },
  en: {
    guideTitle: "Self-Hosting & Gemini API Connection Guide",
    guideSubtitle: "Configure your self-hosted instance with your private Gemini API key for 100% privacy assurance.",
    aiOnline: "AI GATEWAY: ONLINE",
    aiOffline: "AI GATEWAY: OFFLINE (SETUP REQUIRED)",
    aiChecking: "CHECKING AI STATUS...",
    hideGuide: "Hide Setup Guide",
    showGuide: "Show Setup Guide",
    q1: "Will Gmail/Google integration work for self-hosted instances?",
    a1: "Yes! Connecting your Google Account authorizing Gmail is completed via OAuth. It runs entirely direct between your instance and Google. Mails are dispatched straight from your private mailbox, and the developer's server is never involved contextually. The developer has zero access to your tokens or your mailbox.",
    q2: "If a user has a free Google account (no Workspace/Gemini Pro), will this work?",
    a2: "Absolutely! A basic, free consumer `@gmail.com` account works flawlessly for Gmail sending and auto-monitoring. No paid Google Workspace subscriptions or Gemini Advanced licenses are required.",
    q3: "How do I acquire and connect my Gemini API Key?",
    a3_step1: "1. Head to Google AI Studio (https://aistudio.google.com).",
    a3_step2: "2. Authenticate with any free Google account and select 'Get API Key' to generate a token.",
    a3_step3: "3. The free-tier has a generous quota of 15 Requests per Minute (RPM) at completely zero cost ($0).",
    a3_step4: "4. In your self-hosted directory, add the key to your `.env` file: GEMINI_API_KEY=your_key_here and reboot the server.",
  }
} as const;

export const SUGGESTED_PRIVACY_PROMPTS_EN = [
  "How can I delete my phone listing from Greek directories (11888.gr, vrisko.gr, xo.gr) under GDPR?",
  "What is the difference between Greek Law 4624/2019 and general EU GDPR rules regarding erasure?",
  "If a broker refuses my GDPR deletion, how do I file a complaint with the Greek Hellenic Data Protection Authority (HDPA)?",
  "How did international scraping databases acquire my private contact info inside Greece?",
  "Are recruiters and B2B platforms like ZoomInfo legally required to honor GDPR requests for Greek professionals?"
];

export const SUGGESTED_PRIVACY_PROMPTS_EL = [
  "Πώς μπορώ να διαγράψω τον τηλεφωνικό μου κατάλογο από τις ελληνικές βάσεις (11888.gr, vrisko.gr, xo.gr) υπό το GDPR;",
  "Ποια είναι η διαφορά μεταξύ του ελληνικού Νόμου 4624/2019 και των γενικών κανόνων του ευρωπαϊκού GDPR;",
  "Εάν ένας broker αρνηθεί τη διαγραφή μου βάσει GDPR, πώς υποβάλλω καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (ΑΠΔΠΧ);",
  "Πώς απέκτησαν διεθνείς βάσεις δεδομένων (data brokers) τα προσωπικά μου στοιχεία επικοινωνίας στην Ελλάδα;",
  "Υποχρεούνται νομικά οι πλατφόρμες εύρεσης εργασίας και B2B όπως το ZoomInfo να σέβονται τα αιτήματα GDPR Ελλήνων επαγγελματιών;"
];

export default function GeminiAdvisor({
  chatHistory,
  onAddMessage,
  onClearHistory,
  language,
}: GeminiAdvisorProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (active && data) {
          setAiEnabled(data.aiEnabled);
          // Auto-expand/show setup guide if the API key is not configured.
          if (data.aiEnabled === false) {
            setShowSetupGuide(true);
          }
        }
      })
      .catch(err => {
        console.error("Health check call failed:", err);
        if (active) {
          setAiEnabled(false);
          setShowSetupGuide(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const activePrompts = language === 'el' ? SUGGESTED_PRIVACY_PROMPTS_EL : SUGGESTED_PRIVACY_PROMPTS_EN;

  const sendMessageToAi = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString()
    };
    onAddMessage(userMsg);
    setInputText('');
    setLoading(true);

    try {
      // Build historical context array for our Express server endpoint
      const currentHistory = [...chatHistory, userMsg];
      
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: currentHistory,
          language: language
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `m-ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toISOString()
        };
        onAddMessage(assistantMsg);
      } else {
        throw new Error(data.error || 'The server was unable to retrieve a reply.');
      }
    } catch (error: any) {
      console.error("Advisor communication failed:", error);
      const systemErrText = language === 'el'
        ? `⚠️ **Σφάλμα Συστήματος**: Αποτυχία αποστολής ερωτήματος στην πύλη Express Gemini (${error.message || 'Σφάλμα σύνδεσης διακομιστή'}). Παρακαλώ ελέγξτε τη σύνδεσή σας.`
        : `⚠️ **System Error**: Failed to transmit query details to the server-side Gemini gateway (${error.message || 'Server connection error'}). Please check your internet connection or verify the server status.`;
      
      const errMsg: ChatMessage = {
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        text: systemErrText,
        timestamp: new Date().toISOString()
      };
      onAddMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageToAi(inputText);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="advisor-tab">
      
      {/* Header section */}
      <div className="border-b border-[#1a1a1a] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">{toGreekUppercase(TRANSLATIONS[language].aiCounselor)}</span>
          <h1 className="text-2xl md:text-3xl font-serif text-[#e5e5e5] mt-1 flex items-center gap-2">
            {TRANSLATIONS[language].complianceGuide}
          </h1>
          <p className="text-xs text-[#666] mt-1">
            {TRANSLATIONS[language].resolveDisputes}
          </p>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white bg-[#111] border border-[#1a1a1a] hover:border-[#d4af37]/35 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw size={12} /> {TRANSLATIONS[language].clearChatLogs}
          </button>
        )}
      </div>

      {/* Self-Hosting & Gemini API Gateway Setup Guide */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden shadow-xs transition-all">
        {/* Toggle Bar */}
        <button
          type="button"
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="w-full flex items-center justify-between p-4 bg-black/40 hover:bg-black/60 transition-all font-sans text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Cpu size={16} className={aiEnabled ? "text-emerald-400" : "text-amber-500"} />
            <div>
              <h3 className="text-xs font-semibold text-white font-serif">
                {GUIDE_TRANSLATIONS[language].guideTitle}
              </h3>
              <p className="text-[10px] text-[#666] mt-0.5">
                {GUIDE_TRANSLATIONS[language].guideSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
              aiEnabled === true 
                ? "bg-emerald-950/20 text-emerald-400 border-emerald-950/30" 
                : aiEnabled === false 
                  ? "bg-amber-950/20 text-amber-500 border-amber-950/30" 
                  : "bg-[#111] text-[#666] border-[#1a1a1a]"
            }`}>
              {aiEnabled === true 
                ? GUIDE_TRANSLATIONS[language].aiOnline 
                : aiEnabled === false 
                  ? GUIDE_TRANSLATIONS[language].aiOffline 
                  : GUIDE_TRANSLATIONS[language].aiChecking
              }
            </span>
            {showSetupGuide ? (
              <ChevronUp size={14} className="text-[#666]" />
            ) : (
              <ChevronDown size={14} className="text-[#666]" />
            )}
          </div>
        </button>

        {/* Expandable Body */}
        {showSetupGuide && (
          <div className="p-5 border-t border-[#1a1a1a]/60 bg-black/20 font-sans text-xs space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Question 1 */}
              <div className="bg-black/30 border border-[#1a1a1a] p-4 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[#d4af37] font-semibold mb-1">
                    <Mail size={13} />
                    <h4 className="font-serif text-white">{GUIDE_TRANSLATIONS[language].q1}</h4>
                  </div>
                  <p className="text-[11px] text-[#888] leading-relaxed">
                    {GUIDE_TRANSLATIONS[language].a1}
                  </p>
                </div>
              </div>

              {/* Question 2 */}
              <div className="bg-black/30 border border-[#1a1a1a] p-4 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[#d4af37] font-semibold mb-1">
                    <CheckCircle size={13} />
                    <h4 className="font-serif text-white">{GUIDE_TRANSLATIONS[language].q2}</h4>
                  </div>
                  <p className="text-[11px] text-[#888] leading-relaxed">
                    {GUIDE_TRANSLATIONS[language].a2}
                  </p>
                </div>
              </div>

              {/* Question 3 (Steps) */}
              <div className="bg-black/30 border border-[#1a1a1a] p-4 rounded-lg space-y-2 md:col-span-1">
                <div className="flex items-center gap-1.5 text-[#d4af37] font-semibold mb-1 font-serif text-white">
                  <Key size={13} />
                  <h4>{GUIDE_TRANSLATIONS[language].q3}</h4>
                </div>
                <div className="text-[11px] text-[#888] space-y-1.5 leading-relaxed font-sans">
                  <p>{GUIDE_TRANSLATIONS[language].a3_step1}</p>
                  <p>{GUIDE_TRANSLATIONS[language].a3_step2}</p>
                  <p>{GUIDE_TRANSLATIONS[language].a3_step3}</p>
                  <p className="bg-[#111] p-1.5 rounded border border-[#1a1a1a] text-white font-mono text-[10px] select-all">
                    {GUIDE_TRANSLATIONS[language].a3_step4}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Main split: Chat dialogue and Helpful details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Chat window - main area (3 columns) */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl flex flex-col justify-between shadow-xs lg:col-span-3 min-h-[500px] h-[550px]">
          
          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans">
            
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 h-full max-w-md mx-auto space-y-4">
                <span className="p-4 bg-black text-[#d4af37] rounded-full border border-[#1a1a1a]/60">
                  <Sparkles size={24} />
                </span>
                <div>
                  <h3 className="font-serif text-white text-base">{TRANSLATIONS[language].secureHelpdesk}</h3>
                  <p className="text-[#888] text-xs mt-1.5 leading-relaxed">
                    {TRANSLATIONS[language].helpdeskDesc}
                  </p>
                </div>
                
                {/* Micro safety disclaimer */}
                <span className="text-[10px] text-[#555] bg-black border border-[#1a1a1a]/40 p-2.5 rounded-lg leading-relaxed">
                  {TRANSLATIONS[language].safetyDisclaimer}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div 
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[85%] font-sans whitespace-pre-wrap ${
                          isUser 
                            ? 'bg-[#d4af37] text-black font-semibold rounded-br-none' 
                            : 'bg-[#111] text-[#e5e5e5] border border-[#1a1a1a] rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-black border border-[#1a1a1a] rounded-2xl rounded-bl-none px-4 py-3 text-xs text-[#888] flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#d4af37]" />
                      <span>{TRANSLATIONS[language].analysisProgress}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Form input controls */}
          <form onSubmit={handleFormSubmit} className="border-t border-[#1a1a1a] p-4 bg-black rounded-b-xl flex gap-2">
            <input
              type="text"
              autoComplete="off"
              placeholder={loading ? (language === 'el' ? "Δημιουργία ανάλυσης..." : "Generating analysis...") : (language === 'el' ? "Πληκτρολογήστε την ερώτησή σας ή επικολλήστε το email του broker..." : "Type your compliance query or paste a broker's response email...")}
              disabled={loading}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-[#d4af37]/45 focus:outline-none transition-all placeholder:text-[#444]"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] disabled:bg-[#050505] disabled:border-[#1a1a1a] disabled:text-[#444] text-[#d4af37] hover:border-[#d4af37]/45 font-bold p-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>

        </div>

        {/* Suggested Queries panel - RIGHT (1 column) */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 shadow-xs space-y-4 flex flex-col justify-between">
          
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-[#1a1a1a] pb-2 mb-2">
              <Compass size={14} className="text-[#d4af37]" />
              <h4 className="font-serif text-white text-xs uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].promptExplorer)}</h4>
            </div>

            <p className="text-[10px] text-[#555] leading-normal uppercase tracking-wider">
              {toGreekUppercase(TRANSLATIONS[language].selectPromptText)}
            </p>

            <div className="space-y-2 mt-2">
              {activePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessageToAi(prompt)}
                  className="w-full text-left p-3 rounded-lg border border-[#1a1a1a] hover:border-[#d4af37]/40 bg-black/40 hover:bg-black text-[11px] text-[#888] hover:text-[#e5e5e5] font-medium leading-relaxed transition-all block group cursor-pointer"
                >
                  {prompt}
                  <span className="text-[9px] text-[#d4af37] block mt-1 font-semibold group-hover:text-white">{TRANSLATIONS[language].askAi} &rarr;</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black border border-[#1a1a1a] rounded-xl p-3 flex gap-2 text-[10px] text-[#888]">
            <HelpCircle size={14} className="text-[#d4af37] mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              {TRANSLATIONS[language].needFastAudit}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
