import React, { useState, useEffect } from 'react';
import { Broker, ProfileDetails, MemberRemovalState, RemovalStatus } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { ChevronLeft, ArrowUpRight, Copy, Check, Mail, Sparkles, Loader2, Save, ExternalLink, HelpCircle, AlertCircle, Search, RefreshCw, Eye } from 'lucide-react';
import { toGreekUppercase, transliterateGreek } from '../utils/greekUtils';

interface OptOutPanelProps {
  broker: Broker;
  activeMember: ProfileDetails;
  currentState: MemberRemovalState;
  onUpdateStatus: (brokerId: string, status: RemovalStatus, notes: string, actionType: 'sent_email' | 'form_visited' | 'status_changed') => void;
  onBack: () => void;
  language: Language;
  googleToken: string | null;
}

const getLocalizedCategory = (cat: string, lang: Language) => {
  if (lang !== 'el') return cat;
  if (cat === 'People Search') return 'Αναζήτηση Ανθρώπων';
  if (cat === 'Marketing & AdTech') return 'Μάρκετινγκ & Διαφήμιση';
  if (cat === 'Financial & Risk') return 'Χρηματοοικονομικά & Κίνδυνος';
  if (cat === 'Recruitment & B2B') return 'Προσλήψεις & B2B';
  return cat;
};

export default function OptOutPanel({
  broker,
  activeMember,
  currentState,
  onUpdateStatus,
  onBack,
  language,
  googleToken,
}: OptOutPanelProps) {
  const [status, setStatus] = useState<RemovalStatus>('not_started');
  const [notes, setNotes] = useState('');
  
  // Gmail API states
  const [gmailSending, setGmailSending] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [inboxChecking, setInboxChecking] = useState(false);
  const [inboxFeedback, setInboxFeedback] = useState<{ found: boolean; msg: string; emails?: any[] } | null>(null);

  const handleSendGmailApi = async () => {
    if (!googleToken) return;
    setGmailSending(true);
    setGmailFeedback(null);
    try {
      const res = await fetch('/api/gmail/send-optout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleToken,
          to: broker.optOutEmail,
          subject: draftSubject,
          body: draftBody
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGmailFeedback({
          success: true,
          msg: language === 'el' ? '✅ Το email εστάλη επιτυχώς μέσω του Gmail σας!' : '✅ Email sent successfully via your Gmail!'
        });
        
        const note = language === 'el'
          ? `Απεστάλη αυτόματα μέσω Gmail (ID: ${data.messageId})`
          : `Dispatched automatically via Gmail (ID: ${data.messageId})`;
        setNotes(note);
        setStatus('pending');
        onUpdateStatus(broker.id, 'pending', note, 'sent_email');
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      console.error(err);
      setGmailFeedback({
        success: false,
        msg: language === 'el' ? `❌ Σφάλμα αποστολής: ${err.message}` : `❌ Send error: ${err.message}`
      });
    } finally {
      setGmailSending(false);
    }
  };

  const handleCheckInboxApi = async () => {
    if (!googleToken) return;
    setInboxChecking(true);
    setInboxFeedback(null);
    try {
      const res = await fetch('/api/gmail/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleToken,
          brokerDomain: broker.domain,
          brokerName: broker.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.found && data.emails && data.emails.length > 0) {
          setInboxFeedback({
            found: true,
            msg: language === 'el' 
              ? `🔍 Βρέθηκαν ${data.emails.length} σχετικές επικοινωνίες στα εισερχόμενά σας!` 
              : `🔍 Found ${data.emails.length} relevant interaction threads in your inbox!`,
            emails: data.emails
          });
        } else {
          setInboxFeedback({
            found: false,
            msg: language === 'el' 
              ? 'ℹ️ Δεν βρέθηκαν ακόμα απαντήσεις από αυτόν τον broker.' 
              : 'ℹ️ No replies from this broker found in your inbox.'
          });
        }
      } else {
        throw new Error(data.error || 'Failed to search inbox');
      }
    } catch (err: any) {
      console.error(err);
      setInboxFeedback({
        found: false,
        msg: language === 'el' ? `❌ Σφάλμα αναζήτησης: ${err.message}` : `❌ Search error: ${err.message}`
      });
    } finally {
      setInboxChecking(false);
    }
  };

  // Copying helper indicators
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  
  // Custom AI template variables
  const [aiDrafting, setAiDrafting] = useState(false);
  const [legalFrame, setLegalFrame] = useState<'General' | 'CCPA' | 'GDPR'>('GDPR');

  // Feedback notifications
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [draftFeedback, setDraftFeedback] = useState<string | null>(null);
  
  // Current templates loaded (either local preset or custom generated AI draft)
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');

  // Sync inputs with state
  useEffect(() => {
    setStatus(currentState?.status || 'not_started');
    setNotes(currentState?.notes || '');
  }, [currentState]);

  // Sync default legal framework with profile state
  useEffect(() => {
    if (activeMember?.state && (activeMember.state.includes('GDPR') || activeMember.state.includes('EU') || activeMember.state.includes('Greece') || activeMember.state.includes('Attica'))) {
      setLegalFrame('GDPR');
    } else if (activeMember?.state === 'CA') {
      setLegalFrame('CCPA');
    } else {
      setLegalFrame('General');
    }
  }, [activeMember]);

  // Generate local baseline email template based on current profile details
  const getLocalSubjectDraft = () => {
    const draftLang = broker.domain.endsWith('.gr') ? language : 'en';
    const rawName = activeMember?.name || (draftLang === 'el' ? 'Καταναλωτής' : 'Consumer');
    const transliterated = activeMember?.latinName?.trim() || transliterateGreek(rawName);
    const displayName = draftLang === 'en' && transliterated !== rawName ? `${rawName} (${transliterated})` : rawName;
    if (draftLang === 'el') {
      return `Αίτημα Διαγραφής και Μόνιμης Εξαίρεσης Προσωπικών Δεδομένων - ${displayName}`;
    }
    return `Data Deletion and Permanent Opt-Out Request - ${displayName}`;
  };

  const getLocalBodyDraft = () => {
    const draftLang = broker.domain.endsWith('.gr') ? language : 'en';
    const rawName = activeMember?.name || (draftLang === 'el' ? '[Το Πλήρες Όνομά Σας]' : '[Your Full Name]');
    const transliterated = activeMember?.latinName?.trim() || transliterateGreek(rawName);
    const displayName = draftLang === 'en' && transliterated !== rawName ? `${rawName} (${transliterated})` : rawName;

    const email = activeMember?.email || (draftLang === 'el' ? '[Το Email Σας]' : '[Your Email]');
    const alternativeEmails = activeMember?.alternativeEmails?.length > 0 
      ? activeMember.alternativeEmails.join(', ')
      : 'None';
    const phone = activeMember?.phone || (draftLang === 'el' ? '[Το Τηλέφωνό Σας]' : '[Your Phone]');
    const state = activeMember?.state || 'Attica';
    const city = activeMember?.city || '';
    const address = activeMember?.address || '';
    const postalCode = activeMember?.postalCode || '';

    if (draftLang === 'el') {
      let citation_el = 'των νόμων περί προστασίας προσωπικών δεδομένων';
      if (state.includes('GDPR') || state === 'EU' || state.includes('Greece') || state.includes('Attica')) {
        citation_el = 'του Γενικού Κανονισμού Προστασίας Δεδομένων (EU GDPR, Άρθρο 17 - Δικαίωμα στη Λήθη) και του ελληνικού εφαρμοστικού Νόμου 4624/2019';
      }

      return `Αξιότιμη ομάδα του ${broker.name},

Ονομάζομαι ${rawName} και επικοινωνώ μαζί σας για να υποβάλω επίσημο αίτημα διαγραφής και permanent opt-out των προσωπικών μου δεδομένων από τα συστήματά σας.

Σύμφωνα με τους ισχύοντες κανονισμούς προστασίας απορρήτου, συμπεριλαμβανομένου ${citation_el}, απαιτώ να διαγράψετε οριστικά κάθε προσωπική μου πληροφορία, προφίλ καταναλωτή, ιστορικό background καταγραφών και διαφημιστικό αρχείο που σχετίζεται με την ταυτότητά μου από τους καταλόγους, τις βάσεις δεδομένων και τις λίστες σας που ενοικιάζονται σε τρίτους.

Για να μπορέσετε να εντοπίσετε και να απομονώσετε τα στοιχεία μου στα συστήματά σας, παρακαλώ ανατρέξτε στα στοιχεία μου παρακάτω:

- Πλήρες Όνομα: ${rawName}
- Κύριο Email: ${email}
${activeMember?.alternativeEmails?.length > 0 ? `- Ιστορικά / Εναλλακτικά Email: ${alternativeEmails}\n` : ''}${phone ? `- Τηλέφωνο Επικοινωνίας: ${phone}\n` : ''}${address ? `- Διεύθυνση Κατοικίας: ${address}, ${city}, ${state} ${postalCode}\n` : ''}
Επιπλέον, ζητώ να προστατεύσετε τα στοιχεία αυτά προσθέτοντάς τα σε μια μόνιμη λίστα καταστολής (suppression list) για να αποφευχθεί οποιαδήποτε μελλοντική συλλογή, μεταπώληση ή επεξεργασία των προσωπικών μου δεδομένων από τα συστήματά σας.

Παρακαλώ να μου επιβεβαιώσετε γραπτώς (στο email που αναφέρεται παραπάνω) την ολοκλήρωση της διαγραφής εντός της νόμιμης προθεσμίας των 30 ημερών.

Σας ευχαριστώ για τη συνεργασία και τη συμμόρφωσή σας.

Με εκτίμηση,
${rawName}
Επικοινωνία: ${email}`;
    }

    let citation = 'consumer privacy protection acts';
    if (state.includes('GDPR') || state === 'EU' || state.includes('Greece') || state.includes('Attica')) {
      citation = 'General Data Protection Regulation (EU GDPR, Article 17 - Right to Erasure / Δικαίωμα στη Λήθη) and enforcement pathways under Greek Law 4624/2019';
    } else if (state === 'CA') {
      citation = 'California Consumer Privacy Act (CCPA / CPRA)';
    } else if (state === 'CO') {
      citation = 'Colorado Privacy Act (CPA)';
    } else if (state === 'VA') {
      citation = 'Virginia Consumer Data Protection Act (VCDPA)';
    } else if (state === 'CT') {
      citation = 'Connecticut Data Privacy Act (CTDPA)';
    } else if (state === 'UT') {
      citation = 'Utah Consumer Privacy Act (UCPA)';
    } else {
      citation = 'General Data Protection Regulation (EU GDPR, Article 17 - Right to Erasure)';
    }

    return `Dear Team at ${broker.name},

My name is ${displayName} and I am writing to submit a formal data suppression and deletion request.

Pursuant to applicable commercial privacy guidelines and consumer protection protocols${state !== 'Other' ? `, including the ${citation}` : ''}, I hereby demand that you permanently delete and purge all personal information, consumer profiling, background registry logs, and marketing records associated with my identity from your index directories, databases, and third-party list rentals.

To ensure you can search and isolate my exact listings within your database systems, please refer to my personal credentials listed below:

- Full Name: ${displayName}
- Primary Email: ${email}
${activeMember?.alternativeEmails?.length > 0 ? `- Historical/Alternative Emails: ${alternativeEmails}\n` : ''}${phone ? `- Telephone Number: ${phone}\n` : ''}${address ? `- Addresses Filed: ${address}, ${city}, ${state} ${postalCode}\n` : ''}
Furthermore, I request that you add these elements to a permanent suppression list to prevent future re-scraping, harvesting, or selling of my records by your systems.

Please confirm in writing (to the email address provided above) once this request has been completely processed in your databases.

Thank you for your timely compliance.

Sincerely,
${displayName}
Contact: ${email}`;
  };

  // Set the default drafts
  useEffect(() => {
    setDraftSubject(getLocalSubjectDraft());
    setDraftBody(getLocalBodyDraft());
  }, [broker, activeMember, language]);

  // Trigger server-side Gemini custom compiler API
  const handleGenerateAiDraft = async () => {
    setAiDrafting(true);
    try {
      const response = await fetch('/api/gemini/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerName: broker.name,
          brokerDomain: broker.domain,
          category: broker.category,
          legalFrame: legalFrame === 'CCPA' ? 'California CCPA/CPRA (Sections 1798.105 & 1798.130)' : legalFrame === 'GDPR' ? 'EU GDPR (Article 17 Right to Erasure)' : 'General Consumer Suppression laws',
          userProfile: activeMember,
          language: language
        })
      });

      const data = await response.json();
      if (response.ok && data.subject && data.body) {
        setDraftSubject(data.subject);
        setDraftBody(data.body);
      } else {
        throw new Error(data.error || 'Failed to craft request');
      }
    } catch (err: any) {
      console.warn("Gemini compilation failed, using baseline templates:", err);
      const offlineMsg = language === 'el' 
        ? `Το AI δεν είναι διαθέσιμο (${err.message || 'Σφάλμα σύνδεσης διακομιστή'}). Χρήση τοπικού πρότυπου.`
        : `AI Drafting unavailable (${err.message || 'Server connection error'}). Utilizing baseline local template instead.`;
      setDraftFeedback(offlineMsg);
      setTimeout(() => setDraftFeedback(null), 6000);
      setDraftSubject(getLocalSubjectDraft());
      setDraftBody(getLocalBodyDraft());
    } finally {
      setAiDrafting(false);
    }
  };

  // Copy helpers
  const handleCopyText = (text: string, isSubject: boolean) => {
    navigator.clipboard.writeText(text);
    if (isSubject) {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  // Generate direct mailto link triggers local mail agent
  const generateMailtoUrl = () => {
    if (!broker.optOutEmail) return '#';
    const encodedSubject = encodeURIComponent(draftSubject);
    const encodedBody = encodeURIComponent(draftBody);
    return `mailto:${broker.optOutEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  const handleUpdateStatusClick = (event: React.FormEvent) => {
    event.preventDefault();
    onUpdateStatus(broker.id, status, notes, 'status_changed');
    setSaveFeedback(TRANSLATIONS[language].trackingUpdatedSuccess);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleVisitFormLink = () => {
    const actionDesc = language === 'el' 
      ? 'Επίσκεψη στη σελίδα της απευθείας φόρμας διαγραφής του broker.'
      : 'User visited direct opt-out form page.';
    onUpdateStatus(broker.id, 'pending', actionDesc, 'form_visited');
  };

  const handleFormSubmittedClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setStatus('pending');
    setNotes(TRANSLATIONS[language].formSubmittedNotes);
    onUpdateStatus(broker.id, 'pending', TRANSLATIONS[language].formSubmittedNotes, 'status_changed');
    setSaveFeedback(TRANSLATIONS[language].trackingUpdatedSuccess);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleMailtoClick = () => {
    const actionDesc = language === 'el'
      ? 'Ξεκίνησε το αίτημα διαγραφής μέσω email.'
      : 'Initiated suppression request email.';
    onUpdateStatus(broker.id, 'pending', actionDesc, 'sent_email');
  };

  const getLocalizedDifficulty = (difficulty: string) => {
    if (language !== 'el') return difficulty;
    if (difficulty.toLowerCase() === 'easy') return TRANSLATIONS[language].difficultyEasy;
    if (difficulty.toLowerCase() === 'medium') return TRANSLATIONS[language].difficultyMedium;
    if (difficulty.toLowerCase() === 'hard') return TRANSLATIONS[language].difficultyHard;
    return difficulty;
  };

  const getLocalizedSensitivity = (sensitivity: string) => {
    if (language !== 'el') return `${sensitivity} Sensitivity`;
    if (sensitivity === 'High') return 'Υψηλή Ευαισθησία';
    if (sensitivity === 'Medium') return 'Μεσαία Ευαισθησία';
    if (sensitivity === 'Low') return 'Χαμηλή Ευαισθησία';
    return sensitivity;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="optout-panel">
      
      {/* Return Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-[#888] hover:text-[#d4af37] bg-[#111] border border-[#1a1a1a] hover:border-[#d4af37]/40 py-1.5 px-3.5 rounded-lg transition-all cursor-pointer"
      >
        <ChevronLeft size={14} /> {TRANSLATIONS[language].backToDirectory}
      </button>

      {/* Main Grid splitting details and interaction workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary & status log */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-6 block">
          
          <div>
            <span className="text-[10px] bg-black border border-[#1a1a1a]/60 text-[#888] font-mono tracking-widest px-2.5 py-0.5 rounded uppercase font-semibold inline-flex items-center justify-center text-center">
              {toGreekUppercase(getLocalizedCategory(broker.category, language))}
            </span>
            <h2 className="text-xl font-serif text-white tracking-tight mt-2.5">
              {broker.name}
            </h2>
            <a 
              href={`https://${broker.domain}`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-[#d4af37] hover:text-white font-medium select-all hover:underline flex items-center gap-0.5 mt-0.5"
            >
              {broker.domain} <ExternalLink size={10} />
            </a>
          </div>

          <div className="border-t border-[#1a1a1a] pt-4 space-y-3">
            <h4 className="text-xs font-serif text-white font-semibold">{TRANSLATIONS[language].brokerOverview}</h4>
            <p className="text-xs text-[#888] leading-relaxed">
              {language === 'el' && typeof broker.description_el !== 'undefined' ? broker.description_el : broker.description}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#1a1a1a] pt-4 text-xs font-medium">
            <div className="bg-[#050505] border border-[#1a1a1a] p-2.5 rounded-lg">
              <span className="text-[#555] block text-[9px] uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].riskValue)}</span>
              <span className={`font-semibold text-xs ${broker.sensitivity === 'High' ? 'text-red-400' : broker.sensitivity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {getLocalizedSensitivity(broker.sensitivity)}
              </span>
            </div>
            <div className="bg-[#050505] border border-[#1a1a1a] p-2.5 rounded-lg">
              <span className="text-[#555] block text-[9px] uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].difficultyValue)}</span>
              <span className="font-semibold text-[#e5e5e5] text-xs">{getLocalizedDifficulty(broker.difficulty)}</span>
            </div>
          </div>

          {/* Tracking Form Action panel */}
          <div className="border-t border-[#1a1a1a] pt-5 space-y-4">
            <h4 className="text-xs font-serif text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span> {TRANSLATIONS[language].trackDeletionTitle}
            </h4>
            <p className="text-[10px] text-[#555]">
              {TRANSLATIONS[language].updateIndicators} <strong className="text-white font-semibold">{activeMember?.name}</strong>:
            </p>

            <form onSubmit={handleUpdateStatusClick} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">{toGreekUppercase(TRANSLATIONS[language].statusLabelText)}</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full bg-[#050505] text-[#e5e5e5] border border-[#1a1a1a] text-xs font-medium rounded-lg py-2 px-3 focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none cursor-pointer"
                >
                  <option value="not_started">{language === 'el' ? '⚪ Δεν Έχει Ξεκινήσει' : '⚪ Not Started'}</option>
                  <option value="pending">{language === 'el' ? '🔵 Εκκρεμεί Επιβεβαίωση' : '🔵 Request Pending Confirmation'}</option>
                  <option value="action_required">{language === 'el' ? '🟡 Απαιτείται Ενέργεια (Φόρμες)' : '🟡 Direct Form Action Required'}</option>
                  <option value="completed">{language === 'el' ? '🟢 Ολοκληρώθηκε' : '🟢 Done - Records Deleted'}</option>
                  <option value="rejected">{language === 'el' ? '🔴 Απορρίφθηκε' : '🔴 Blocked / Opt-In Refused'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">{toGreekUppercase(TRANSLATIONS[language].progressNotes)}</label>
                <textarea
                  placeholder={TRANSLATIONS[language].notesPlaceholder}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg p-2.5 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/40 focus:outline-none placeholder:text-[#444] font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#111] hover:bg-[#1a1a1a] text-[#d4af37] border border-[#1a1a1a] hover:border-[#d4af37]/45 rounded-lg py-2 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={13} /> {TRANSLATIONS[language].applyProgressMarker}
              </button>

              {saveFeedback && (
                <div className="p-2.5 rounded-lg text-[11px] font-semibold font-sans bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 text-center animate-fade-in flex items-center justify-center gap-1">
                  <Check size={12} /> {saveFeedback}
                </div>
              )}
            </form>
            
            {googleToken && (
              <div className="border-t border-[#1a1a1a] pt-4 mt-2 space-y-2.5">
                <span className="text-[9px] text-[#666] uppercase font-bold block tracking-wider">
                  {toGreekUppercase(language === 'el' ? 'Σαρωτής Εισερχομένων Gmail' : 'Gmail Inbox Scanner')}
                </span>
                
                <button
                  type="button"
                  onClick={handleCheckInboxApi}
                  disabled={inboxChecking}
                  className="w-full bg-[#0a0a0a] hover:bg-[#111] text-[#888] hover:text-white border border-[#1a1a1a] rounded-lg py-2 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {inboxChecking ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      {language === 'el' ? 'Σκανάρισμα...' : 'Scanning Inbox...'}
                    </>
                  ) : (
                    <>
                      <Search size={13} className="text-[#d4af37]" />
                      {language === 'el' ? 'Έλεγχος εισερχομένων (Gmail)' : 'Scan Gmail for replies'}
                    </>
                  )}
                </button>

                {inboxFeedback && (
                  <div className="bg-black/40 border border-[#1a1a1a]/60 p-3 rounded-lg text-xs space-y-2 animate-fade-in text-left">
                    <p className={`font-semibold ${inboxFeedback.found ? 'text-[#d4af37]' : 'text-[#666]'}`}>
                      {inboxFeedback.msg}
                    </p>
                    
                    {inboxFeedback.found && inboxFeedback.emails && inboxFeedback.emails.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-[#1a1a1a]/60 max-h-[160px] overflow-y-auto pr-1">
                        {inboxFeedback.emails.map((m: any, i: number) => (
                          <div key={i} className="text-[10px] space-y-0.5 border-b border-[#1a1a1a]/30 pb-2 last:border-0 last:pb-0">
                            <p className="text-white font-semibold truncate"><span className="text-[#d4af37]">From:</span> {m.from}</p>
                            <p className="text-[#666] leading-relaxed italic line-clamp-2">"{m.snippet}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!googleToken && (
              <div className="border-t border-[#1a1a1a]/40 pt-4 mt-2 text-[10px] text-[#555] leading-relaxed">
                <p>
                  {language === 'el'
                    ? '💡 Δεν έχετε συνδέσει λογαριασμό Google. Κανένα πρόβλημα! Μπορείτε να αντιγράψετε το έτοιμο email, να το στείλετε μέσω του δικού σας email (π.χ. με το κουμπί "Αποστολή θυρίδας") και να αλλάξετε την κατάσταση χειροκίνητα.'
                    : '💡 Google Account is not connected. No problem! You can copy the generated email, send it through your local client (e.g. using the "Dispatch Mailbox" link), and manually update the status above.'}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Step actions & custom emails creator workspace */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs lg:col-span-2 space-y-6">
          
          <div className="flex border-b border-[#1a1a1a] pb-3 justify-between items-center">
            <div>
              <h3 className="text-lg font-serif text-white">{TRANSLATIONS[language].actionWorkplace}</h3>
              <p className="text-xs text-[#555] mt-0.5">{TRANSLATIONS[language].prepareSubmission}</p>
            </div>
            
            <span className="text-xs font-bold px-2.5 py-1 bg-[#111] border border-[#1a1a1a] rounded text-[#d4af37] font-mono uppercase tracking-wider">
              {toGreekUppercase(`${TRANSLATIONS[language].method} ${broker.optOutMethod}`)}
            </span>
          </div>

          {/* RENDER DYNAMIC COMPONENT BLOCKS BASED ON BROKER TYPE */}

          {/* BLOCK 1: Web form instructions if broker has forms */}
          {broker.optOutUrl && (
            <div className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="font-serif font-bold text-[#e5e5e5] text-sm">{TRANSLATIONS[language].webFormRequired}</h4>
                  <p className="text-[#888] text-xs mt-0.5">
                    {TRANSLATIONS[language].webFormDesc}
                  </p>
                </div>
              </div>

              {/* Step list instructions */}
              <div className="pl-7 text-xs space-y-2.5 py-1.5">
                {broker.instructions.map((step, idx) => {
                  // Fallback to Greek localized steps if present in database entries
                  const localizedStep = (language === 'el' && typeof (broker as any).instructions_el !== 'undefined' && (broker as any).instructions_el[idx]) 
                    ? (broker as any).instructions_el[idx]
                    : step;
                  return (
                    <div key={idx} className="flex gap-2.5 leading-relaxed bg-[#0a0a0a]/50 p-2 rounded-lg border border-[#1a1a1a]">
                      <span className="font-mono font-bold text-amber-500 shrink-0 select-none bg-amber-950/40 border border-amber-900/40 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{idx + 1}</span>
                      <span className="text-[11px] text-[#e5e5e5] font-sans mt-0.5">{localizedStep}</span>
                    </div>
                  );
                })}
              </div>

              {/* Command button launcher */}
              <div className="pl-7 pt-1.5 flex flex-wrap gap-2.5">
                <a
                  href={broker.optOutUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={handleVisitFormLink}
                  className="bg-amber-600 hover:bg-amber-500 text-black rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  {TRANSLATIONS[language].launchRemovalForm} <ArrowUpRight size={14} />
                </a>
                <button
                  type="button"
                  onClick={handleFormSubmittedClick}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {TRANSLATIONS[language].formSubmittedBtn}
                </button>
              </div>
            </div>
          )}

          {/* BLOCK 2: Email Draft Generator and controls */}
          {broker.optOutEmail && (
            <div className="bg-[#050505] border border-[#111] rounded-xl p-5 space-y-4">
              
              {draftFeedback && (
                <div className="p-3 rounded-lg text-xs font-semibold font-sans bg-[#111] text-[#d4af37] border border-[#d4af37]/25 flex items-center gap-2 animate-fade-in">
                  <Sparkles size={14} className="text-[#d4af37] shrink-0" />
                  <span>{draftFeedback}</span>
                </div>
              )}
              
              {/* Premium AI generator header panel */}
              <div className="bg-black border border-[#1a1a1a] p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="text-[#d4af37] mt-1 shrink-0" size={18} />
                  <div>
                    <h4 className="font-serif font-bold text-[#e5e5e5] text-sm">{TRANSLATIONS[language].aiDraftCustomizer}</h4>
                    <p className="text-[#555] text-[10px] mt-0.5 leading-relaxed uppercase tracking-wider">
                      {toGreekUppercase(TRANSLATIONS[language].aiDraftDesc)}
                    </p>
                  </div>
                </div>

                {/* AI control bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={legalFrame}
                    onChange={(e: any) => setLegalFrame(e.target.value)}
                    className="bg-[#0a0a0a] text-white border border-[#1a1a1a] text-xs font-medium rounded-lg py-1.5 px-2 focus:ring-1 focus:ring-[#d4af37]/45 focus:outline-none cursor-pointer"
                  >
                    <option value="General">{language === 'el' ? '🇺🇸 Γενική Προστασία ΗΠΑ' : '🇺🇸 General US Protection'}</option>
                    <option value="CCPA">{language === 'el' ? '🌴 Καλιφόρνια CCPA/CPRA' : '🌴 California CCPA/CPRA'}</option>
                    <option value="GDPR">{language === 'el' ? '🇪🇺 Ευρωπαϊκό GDPR (Άρθρ. 17)' : '🇪🇺 European GDPR (Art. 17)'}</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateAiDraft}
                    disabled={aiDrafting}
                    className="bg-[#d4af37] text-black hover:bg-[#c4a030] disabled:bg-[#111] disabled:text-[#444] disabled:border-[#1a1a1a] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {aiDrafting ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-zinc-500 animate-pulse" />
                        {TRANSLATIONS[language].draftingStatus}
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-black" />
                        {TRANSLATIONS[language].customizeDraftBtn}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="text-xs bg-black border border-[#1a1a1a]/60 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <span className="text-[#555] block text-[9px] uppercase tracking-widest font-bold">{toGreekUppercase(TRANSLATIONS[language].complianceEmail)}</span>
                  <span className="font-semibold text-white font-mono select-all text-sm">{broker.optOutEmail}</span>
                </div>
                
                <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                  <a
                    href={generateMailtoUrl()}
                    onClick={handleMailtoClick}
                    className="bg-[#111] border border-[#1a1a1a] hover:bg-[#1a1a1a] text-[#888] hover:text-white hover:border-[#333] text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail size={13} /> {TRANSLATIONS[language].dispatchMailbox}
                  </a>

                  {googleToken && (
                    <button
                      type="button"
                      onClick={handleSendGmailApi}
                      disabled={gmailSending}
                      className="bg-[#d4af37] text-black hover:bg-[#c4a030] disabled:bg-[#111] disabled:text-[#444] text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider text-[10px]"
                    >
                      {gmailSending ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          {language === 'el' ? 'ΑΠΟΣΤΟΛΗ...' : 'SENDING...'}
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          {language === 'el' ? 'ΑΠΟΣΤΟΛΗ ΜΕΣΩ GMAIL' : 'SEND VIA GMAIL'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {gmailFeedback && (
                <div className={`p-3.5 rounded-lg text-xs font-bold font-sans animate-fade-in ${gmailFeedback.success ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40' : 'bg-red-950/20 text-red-400 border border-red-900/30'}`}>
                  {gmailFeedback.msg}
                </div>
              )}

              {/* Template Editor Box */}
              <div className="space-y-4">
                
                {/* Subject Block */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-[#666] uppercase tracking-widest">
                    <span>{toGreekUppercase(TRANSLATIONS[language].emailSubject)}</span>
                    <button 
                      type="button"
                      onClick={() => handleCopyText(draftSubject, true)}
                      className="text-[#d4af37] hover:text-white px-1.5 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSubject ? (
                        <>
                          <Check size={11} strokeWidth={3} className="text-emerald-400" /> {TRANSLATIONS[language].copied}
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> {TRANSLATIONS[language].copySubject}
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={draftSubject}
                    onChange={e => setDraftSubject(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2.5 text-xs text-[#e5e5e5] focus:bg-[#080808] focus:ring-1 focus:ring-[#d4af37]/40 focus:outline-none font-medium"
                  />
                </div>

                {/* Body Block */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-[#666] uppercase tracking-widest">
                    <span>{toGreekUppercase(TRANSLATIONS[language].emailBody)}</span>
                    <button 
                      type="button"
                      onClick={() => handleCopyText(draftBody, false)}
                      className="text-[#d4af37] hover:text-white px-1.5 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBody ? (
                        <>
                          <Check size={11} strokeWidth={3} className="text-emerald-400" /> {TRANSLATIONS[language].copied}
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> {TRANSLATIONS[language].copyBody}
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={draftBody}
                    onChange={e => setDraftBody(e.target.value)}
                    rows={12}
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 text-xs text-[#e5e5e5] focus:bg-[#080808] font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#d4af37]/40 resize-y"
                  />
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
