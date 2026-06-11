import { useState } from 'react';
import { Broker, ProfileDetails, TrackingData, HistoryItem, RemovalStatus } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { ShieldCheck, Mail, AlertCircle, CheckCircle2, Bookmark, Flame, Zap, ArrowRight, UserPlus, FileWarning, Sparkles, FileText, Lock, Key, Cpu, Eye, EyeOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toGreekUppercase } from '../utils/greekUtils';

interface DashboardProps {
  brokers: Broker[];
  profile: ProfileDetails;
  trackingData: TrackingData;
  history: HistoryItem[];
  onNavigate: (tab: string) => void;
  language: Language;
  googleUser: { name: string; email: string; picture?: string } | null;
  resubmitIntervalMonths: number;
  onUpdateStatus: (
    brokerId: string, 
    newStatus: RemovalStatus, 
    notesText: string,
    actionType: 'sent_email' | 'form_visited' | 'status_changed'
  ) => void;
  geminiApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  wizardDismissed: boolean;
  onDismissWizard: () => void;
  onOpenWizard: () => void;
}

const getLocalizedStatus = (status: RemovalStatus | string | undefined, lang: Language) => {
  if (!status) return '';
  const camel = status.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
  const key = `status${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
  return (TRANSLATIONS[lang] as any)[key] || status;
};

const getLocalizedAction = (action: string, lang: Language) => {
  if (action === 'sent_email') {
    return lang === 'el' ? 'Αποστολή Email' : 'Email Sent';
  }
  if (action === 'form_visited') {
    return lang === 'el' ? 'Επίσκεψη Φόρμας' : 'Form Visited';
  }
  if (action === 'status_changed') {
    return lang === 'el' ? 'Αλλαγή Κατάστασης' : 'Status Changed';
  }
  return action.replace('_', ' ');
};

export default function Dashboard({
  brokers,
  profile,
  trackingData,
  history,
  onNavigate,
  language,
  googleUser,
  resubmitIntervalMonths,
  onUpdateStatus,
  geminiApiKey,
  googleClientId,
  googleClientSecret,
  wizardDismissed,
  onDismissWizard,
  onOpenWizard
}: DashboardProps) {
  const activeMember = profile;
  
  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldCheck className="h-16 w-16 text-zinc-300 mb-4 animate-pulse" />
        <h3 className="text-xl font-medium text-zinc-300">{TRANSLATIONS[language].noProfilesTitle}</h3>
        <p className="text-zinc-500 max-w-sm mt-1">{TRANSLATIONS[language].noProfilesDesc}</p>
        <button
          onClick={() => onNavigate('profiles')}
          className="mt-6 flex items-center gap-2 bg-[#d4af37] text-black hover:bg-[#c4a030] px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
        >
          <UserPlus size={16} /> {TRANSLATIONS[language].createInitialProfile}
        </button>
      </div>
    );
  }

  // Calculate statistics for the active family member
  const memberState = trackingData[activeMember.id] || {};
  
  let completed = 0;
  let completedEmails = 0;
  let completedForms = 0;
  let pendingEmails = 0;
  let pendingForms = 0;
  let actionRequired = 0;
  let notStarted = 0;
  let rejected = 0;

  brokers.forEach(broker => {
    const state = memberState[broker.id]?.status || 'not_started';
    if (state === 'completed') {
      completed++;
      if (broker.optOutMethod === 'Email' || broker.optOutMethod === 'Both') {
        completedEmails++;
      } else {
        completedForms++;
      }
    } else if (state === 'pending') {
      if (broker.optOutMethod === 'Email' || broker.optOutMethod === 'Both') {
        pendingEmails++;
      } else {
        pendingForms++;
      }
    } else if (state === 'action_required') {
      actionRequired++;
    } else if (state === 'rejected') {
      rejected++;
    } else {
      notStarted++;
    }
  });

  const total = brokers.length;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // High sensitivity counts completed
  const highSensitivityBrokers = brokers.filter(b => b.sensitivity === 'High');
  const highCompleted = highSensitivityBrokers.filter(b => memberState[b.id]?.status === 'completed').length;

  // Calculate due resubmissions
  const resubmitIntervalMs = resubmitIntervalMonths * 30 * 24 * 60 * 60 * 1000;
  const dueResubmissions = brokers.filter(broker => {
    const state = memberState[broker.id];
    if (state?.status !== 'completed' || !state?.completedAt) return false;
    const completedTime = new Date(state.completedAt).getTime();
    return (Date.now() - completedTime) >= resubmitIntervalMs;
  });

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-tab">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-5">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">{toGreekUppercase(TRANSLATIONS[language].livePrivacyStatus)}</span>
          <h1 className="text-2xl md:text-3xl font-serif text-[#e5e5e5] mt-1">
            {TRANSLATIONS[language].welcome} <span className="italic text-[#d4af37]">{activeMember.name}</span>
          </h1>
          <p className="text-xs text-[#666] mt-1">
            {TRANSLATIONS[language].trackingVectors}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Google Connection Badge */}
          <div className="flex items-center gap-2.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-xs font-semibold">
            {googleUser ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                <span className="text-[#888] font-sans">
                  {language === 'el' ? 'Συνδεδεμένος λογαριασμός:' : 'Connected account:'}{' '}
                  <strong className="text-white font-mono select-all font-semibold">{googleUser.email}</strong>
                </span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                <span className="text-[#666] font-sans">
                  {language === 'el' ? 'Μη συνδεδεμένος λογαριασμός' : 'Not connected'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Setup Wizard Banner */}
      {!wizardDismissed && (!googleClientId || !geminiApiKey) && (
        <div className="bg-[#0c0c0e] border border-[#d4af37]/20 rounded-xl p-5 shadow-[0_0_15px_rgba(212,175,55,0.02)] space-y-4 animate-fade-in font-sans">
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] pb-3">
            <span className="p-1.5 bg-[#d4af37]/10 text-[#d4af37] rounded-lg">
              <Sparkles size={16} />
            </span>
            <h3 className="text-sm font-serif text-white uppercase tracking-wider">
              {language === 'el' ? 'ΟΔΗΓΟΣ ΕΓΚΑΤΑΣΤΑΣΗΣ API & CREDENTIALS' : 'LOTOS CONFIGURATION WIZARD'}
            </h3>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={onOpenWizard}
                className="text-[10px] text-[#d4af37] hover:text-white transition-colors font-bold uppercase tracking-wider border border-[#d4af37]/30 px-2.5 py-1 rounded-md bg-[#111] cursor-pointer"
              >
                {toGreekUppercase(language === 'el' ? 'Ρύθμιση Τώρα' : 'Configure Now')}
              </button>
              <button 
                onClick={onDismissWizard}
                className="text-[10px] text-[#666] hover:text-[#d4af37] transition-colors font-bold uppercase tracking-wider border border-[#1a1a1a] px-2.5 py-1 rounded-md bg-black/40 cursor-pointer"
              >
                {toGreekUppercase(language === 'el' ? 'Παράβλεψη' : 'Dismiss')}
              </button>
            </div>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            {language === 'el'
              ? 'Για να ξεκλειδώσετε τις πλήρεις δυνατότητες του Λωτού (αυτόματες επανυποβολές Gmail και compliance advisor), παρακαλούμε συνδέστε τα κλειδιά API σας. Μπορείτε να τα εισαγάγετε απευθείας στην καρτέλα Ρυθμίσεις.'
              : 'To unlock the full potential of Lotos (automated Gmail resubmissions and compliance advisor AI), please configure your API gateway keys directly in the Settings tab.'}
          </p>
          <div className="flex flex-wrap gap-4 text-[10px] text-[#666] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${geminiApiKey ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span>Gemini AI: {geminiApiKey ? 'Active' : 'Missing'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${googleClientId && googleClientSecret ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span>Google API Gateway: {googleClientId && googleClientSecret ? 'Active' : 'Missing'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Due Resubmissions Notifications banner */}
      {dueResubmissions.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#d4af37]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(212,175,55,0.03)] space-y-4 animate-fade-in font-sans">
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] pb-3">
            <span className="p-1.5 bg-[#d4af37]/10 text-[#d4af37] rounded-lg">
              <AlertCircle size={16} />
            </span>
            <h3 className="text-sm font-serif text-white uppercase tracking-wider">
              {language === 'el' ? 'ΑΠΑΙΤΟΥΝΤΑΙ ΕΠΑΝΥΠΟΒΟΛΕΣ ΔΙΑΓΡΑΦΩΝ' : 'REMOVAL RESUBMISSIONS DUE'}
            </h3>
            <span className="ml-auto bg-[#d4af37] text-black text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              {dueResubmissions.length}
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {dueResubmissions.map(broker => {
              const state = memberState[broker.id];
              const completedDate = state?.completedAt ? new Date(state.completedAt).toLocaleDateString() : '';
              const supportsEmail = broker.optOutMethod === 'Email' || broker.optOutMethod === 'Both';
              const isAutoAvailable = supportsEmail && !!googleUser;

              return (
                <div key={broker.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/40 border border-[#1a1a1a] rounded-lg">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {broker.name} 
                      <span className="text-[10px] font-normal text-[#666]">({broker.domain})</span>
                    </h4>
                    <p className="text-[10px] text-[#888] mt-0.5 leading-relaxed font-sans">
                      {language === 'el'
                        ? `Ολοκληρώθηκε στις ${completedDate} (${resubmitIntervalMonths} μήνες πριν).`
                        : `Verified on ${completedDate} (${resubmitIntervalMonths} months elapsed).`}
                      {' '}
                      <span className="text-[#d4af37] font-semibold">
                        {isAutoAvailable
                          ? (language === 'el' ? 'Προγραμματισμένη αυτόματη επανυποβολή.' : 'Automated sweep email scheduled.')
                          : (language === 'el' ? 'Απαιτείται μη αυτόματη ενέργεια.' : 'Manual action required.')}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {isAutoAvailable ? (
                      <button
                        onClick={async (e) => {
                          const btn = e.currentTarget;
                          btn.disabled = true;
                          const originalText = btn.innerText;
                          btn.innerText = language === 'el' ? 'Αποστολή...' : 'Sending...';
                          try {
                            const sweepRes = await fetch('/api/cron/sweep');
                            const sweepData = await sweepRes.json();
                            if (sweepRes.ok && sweepData.success) {
                              onUpdateStatus(
                                broker.id, 
                                'pending', 
                                language === 'el' 
                                  ? `[Επανυποβολή] Ξεκίνησε αυτόματη επανυποβολή.` 
                                  : `[Resubmit] Re-sent automated opt-out email.`,
                                'sent_email'
                              );
                            } else {
                              throw new Error(sweepData.error || 'Sweep failed');
                            }
                          } catch (err) {
                            alert(language === 'el' ? 'Αποτυχία επανυποβολής' : 'Resubmit failed');
                            btn.disabled = false;
                            btn.innerText = originalText;
                          }
                        }}
                        className="bg-[#d4af37] hover:bg-[#c4a030] text-black text-[10px] font-bold px-3 py-1.5 rounded-md transition-all shadow-xs cursor-pointer"
                      >
                        {language === 'el' ? 'Αποστολή Τώρα' : 'Send Resubmit Now'}
                      </button>
                    ) : (
                      <a
                        href={broker.optOutUrl || `https://${broker.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          onUpdateStatus(
                            broker.id, 
                            'action_required', 
                            language === 'el' 
                              ? `[Επανυποβολή] Εκκρεμεί μη αυτόματη υποβολή φόρμας.` 
                              : `[Resubmit] Form visit initiated for manual resubmission.`,
                            'form_visited'
                          );
                        }}
                        className="bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#d4af37]/30 text-[#d4af37] hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center"
                      >
                        {language === 'el' ? 'Άνοιγμα Φόρμας' : 'Launch Form'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Completed */}
        <div className="bg-[#0a0a0a] text-[#e5e5e5] rounded-xl p-5 border border-[#d4af37]/30 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest">{toGreekUppercase(TRANSLATIONS[language].brokerRemovals)}</p>
              <h3 className="text-3xl font-serif text-[#d4af37] mt-1 tracking-tight">{completed} <span className="text-sm font-normal text-[#666]">/ {total}</span></h3>
            </div>
            <span className="p-2 bg-[#111] rounded-lg text-[#d4af37] border border-[#1a1a1a]">
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#1a1a1a]">
              <div 
                className="bg-[#d4af37] h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-2 border-t border-[#1a1a1a]/60 pt-2.5 text-[11px]">
            <div>
              <span className="text-[#666] block text-[9px] uppercase tracking-wider">{language === 'el' ? 'ΥΠΟΒΛΗΘΗΚΑΝ' : 'SUBMITTED'}</span>
              <span className="text-blue-400 font-mono font-semibold">{pendingEmails + pendingForms}</span>
            </div>
            <div>
              <span className="text-[#666] block text-[9px] uppercase tracking-wider">{language === 'el' ? 'ΕΠΙΒΕΒΑΙΩΘΗΚΑΝ' : 'VERIFIED'}</span>
              <span className="text-emerald-400 font-mono font-semibold">{completed}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Pending/Sent Requests */}
        <div className="bg-[#0a0a0a] text-[#e5e5e5] rounded-xl p-5 border border-[#1a1a1a] shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest">{toGreekUppercase(TRANSLATIONS[language].emailsSent)}</p>
              <h3 className="text-3xl font-serif mt-1 tracking-tight text-white">{pendingEmails + completedEmails}</h3>
            </div>
            <span className="p-2 bg-blue-950/20 rounded-lg text-blue-400 border border-blue-900/30">
              <Mail size={18} />
            </span>
          </div>
          
          <div className="flex gap-4 mt-2 border-t border-[#1a1a1a]/60 pt-2.5 text-[11px]">
            <div>
              <span className="text-[#666] block text-[9px] uppercase tracking-wider">{language === 'el' ? 'ΥΠΟΒΛΗΘΗΚΑΝ' : 'SUBMITTED'}</span>
              <span className="text-blue-400 font-mono font-semibold">{pendingEmails}</span>
            </div>
            <div>
              <span className="text-[#666] block text-[9px] uppercase tracking-wider">{language === 'el' ? 'ΕΠΙΒΕΒΑΙΩΘΗΚΑΝ' : 'VERIFIED'}</span>
              <span className="text-emerald-400 font-mono font-semibold">{completedEmails}</span>
            </div>
          </div>

          <p className="text-[10px] text-[#555] mt-2 leading-relaxed">
            {TRANSLATIONS[language].waitingConfirmation}
          </p>
        </div>

        {/* Metric 3: Forms Submitted */}
        <div className="bg-[#0a0a0a] text-[#e5e5e5] rounded-xl p-5 border border-[#1a1a1a] shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest">{toGreekUppercase(TRANSLATIONS[language].formsRequired)}</p>
              <h3 className="text-3xl font-serif mt-1 tracking-tight text-white">{pendingForms + completedForms}</h3>
            </div>
            <span className="p-2 bg-amber-950/20 rounded-lg text-amber-400 border border-amber-900/30">
              <FileText size={18} />
            </span>
          </div>

          <div className="flex gap-4 mt-2 border-t border-[#1a1a1a]/60 pt-2.5 text-[11px]">
            <div>
              <span className="text-[#666] block text-[9px] uppercase tracking-wider">{language === 'el' ? 'ΥΠΟΒΛΗΘΗΚΑΝ' : 'SUBMITTED'}</span>
              <span className="text-blue-400 font-mono font-semibold">{pendingForms}</span>
            </div>
            <div>
              <span className="text-[#666] block text-[9px] uppercase tracking-wider">{language === 'el' ? 'ΕΠΙΒΕΒΑΙΩΘΗΚΑΝ' : 'VERIFIED'}</span>
              <span className="text-emerald-400 font-mono font-semibold">{completedForms}</span>
            </div>
          </div>

          <p className="text-[10px] text-[#555] mt-2 leading-relaxed">
            {TRANSLATIONS[language].directFormsRequired}
          </p>
        </div>

        {/* Metric 4: High Sensitivity Progress */}
        <div className="bg-[#0a0a0a] text-[#e5e5e5] rounded-xl p-5 border border-[#1a1a1a] shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest">{toGreekUppercase(TRANSLATIONS[language].highRiskGuarded)}</p>
              <h3 className="text-3xl font-serif mt-1 tracking-tight text-white">
                {highCompleted} <span className="text-sm font-normal text-[#666]">/ {highSensitivityBrokers.length}</span>
              </h3>
            </div>
            <span className="p-2 bg-red-950/20 rounded-lg text-red-400 border border-red-900/30">
              <Flame size={18} />
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#1a1a1a]">
              <div 
                className="bg-red-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${highSensitivityBrokers.length > 0 ? (highCompleted / highSensitivityBrokers.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-[#666] block mt-1.5">{TRANSLATIONS[language].focusIntegrators}</span>
          </div>
        </div>
      </div>

      {/* Main split: Analytics & Recent actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Tracker Chart Component */}
        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a] shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-serif text-[#e5e5e5]">{TRANSLATIONS[language].removalBreakdown}</h3>
              <p className="text-xs text-[#666] mt-0.5">{TRANSLATIONS[language].statisticalAudit}</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-[#111] text-[#d4af37] border border-[#1a1a1a] rounded-md">
              {total} {toGreekUppercase(TRANSLATIONS[language].totalVectors)}
            </span>
          </div>

          {/* Horizontal Progress Bars */}
          <div className="space-y-4">
            {/* 1. Complete */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#888] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] block"></span> {TRANSLATIONS[language].completedDeletions}
                </span>
                <span className="text-[#e5e5e5] font-mono font-semibold">{completed} ({Math.round(completed/total * 100 || 0)}%)</span>
              </div>
              <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-[#1a1a1a]">
                <div className="bg-[#d4af37] h-full rounded-full" style={{ width: `${completed/total * 100 || 0}%` }}></div>
              </div>
            </div>

            {/* 2. Pending */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#888] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span> {TRANSLATIONS[language].inProgressEmails}
                </span>
                <span className="text-[#e5e5e5] font-mono font-semibold">{pendingEmails + pendingForms} ({Math.round((pendingEmails + pendingForms)/total * 100 || 0)}%)</span>
              </div>
              <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-[#1a1a1a]">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(pendingEmails + pendingForms)/total * 100 || 0}%` }}></div>
              </div>
            </div>

            {/* 3. Action Required */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#888] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span> {TRANSLATIONS[language].manualActionRequired}
                </span>
                <span className="text-[#e5e5e5] font-mono font-semibold">{actionRequired} ({Math.round(actionRequired/total * 100 || 0)}%)</span>
              </div>
              <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-[#1a1a1a]">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${actionRequired/total * 100 || 0}%` }}></div>
              </div>
            </div>

            {/* 4. Not Started */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#888] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 block"></span> {TRANSLATIONS[language].notInitiated}
                </span>
                <span className="text-[#646464] font-mono font-semibold">{notStarted} ({Math.round(notStarted/total * 100 || 0)}%)</span>
              </div>
              <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-[#1a1a1a]">
                <div className="bg-zinc-700 h-full rounded-full" style={{ width: `${notStarted/total * 100 || 0}%` }}></div>
              </div>
            </div>
            
            {/* 5. Rejected */}
            {rejected > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#888] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span> {TRANSLATIONS[language].rejectionsBlocked}
                  </span>
                  <span className="text-[#e5e5e5] font-mono font-semibold">{rejected} ({Math.round(rejected/total * 100 || 0)}%)</span>
                </div>
                <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-[#1a1a1a]">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${rejected/total * 100 || 0}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick tips box */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3.5 flex gap-3 text-xs text-[#888]">
            <Zap className="text-[#d4af37] mt-0.5 shrink-0" size={16} />
            <div>
              <p className="font-semibold text-white">{TRANSLATIONS[language].proactiveMitigation}</p>
              <p className="mt-0.5 leading-relaxed text-[#666]">
                {TRANSLATIONS[language].proactiveMitigationDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Actions Timeline panel */}
        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3 mb-4">
              <h3 className="text-lg font-serif text-[#e5e5e5]">{TRANSLATIONS[language].operationLog}</h3>
              <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">{toGreekUppercase(TRANSLATIONS[language].globalStatus)}</span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8">
                <FileWarning size={32} className="mx-auto text-[#666] mb-2" />
                <p className="text-xs text-[#666]">{TRANSLATIONS[language].zeroOperations}</p>
                <p className="text-[10px] text-[#444] mt-1">{TRANSLATIONS[language].initiateTemplates}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
                {history.slice(0, 5).map((item) => {
                  let alertBg = 'bg-[#111] text-[#888] border border-[#1a1a1a]';
                  let textDesc = '';

                  if (item.action === 'sent_email') {
                    alertBg = 'bg-blue-950/20 text-blue-400 border border-blue-900/30';
                    textDesc = language === 'el' ? `Αποστολή email στο ${item.brokerName}` : `Sent email to ${item.brokerName}`;
                  } else if (item.action === 'form_visited') {
                    alertBg = 'bg-amber-950/20 text-amber-400 border border-amber-900/30';
                    textDesc = language === 'el' ? `Άνοιγμα φόρμας για ${item.brokerName}` : `Opened web form for ${item.brokerName}`;
                  } else if (item.action === 'status_changed') {
                    alertBg = 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30';
                    const mappedStatus = getLocalizedStatus(item.toStatus, language);
                    textDesc = language === 'el' ? `Αλλαγή κατάστασης ${item.brokerName} σε ${mappedStatus}` : `Set status of ${item.brokerName} to ${item.toStatus}`;
                  }

                  return (
                    <div key={item.id} className="text-xs border-l-2 border-[#1a1a1a] pl-3.5 relative py-1">
                      <div className="absolute w-2 h-2 rounded-full bg-[#333] -left-[5px] top-2"></div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-white">{item.memberName}</span>
                        <span className="text-[9px] text-[#666]">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#888] leading-relaxed text-[11px] mb-1.5">{textDesc}</p>
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded font-medium ${alertBg}`}>
                        {item.action === 'status_changed' 
                          ? `${language === 'el' ? 'Κατάσταση' : 'Status'}: ${getLocalizedStatus(item.toStatus, language)}` 
                          : getLocalizedAction(item.action, language)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('brokers')}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-[#111] hover:bg-[#1a1a1a] text-[#d4af37] text-xs font-semibold rounded-lg border border-[#1a1a1a] transition-all cursor-pointer"
          >
            {TRANSLATIONS[language].goToDirectory} &rarr;
          </button>
        </div>
      </div>

      {/* Guide section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-full bg-[#111] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] text-xs font-bold mb-3">1</div>
            <h4 className="font-bold text-white text-sm">{TRANSLATIONS[language].updateProfileCoordinates}</h4>
            <p className="text-[#888] text-xs mt-1 leading-relaxed">
              {TRANSLATIONS[language].updateProfileCoordinatesDesc}
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-full bg-[#111] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] text-xs font-bold mb-3">2</div>
            <h4 className="font-bold text-white text-sm">{TRANSLATIONS[language].selectBrokerDraft}</h4>
            <p className="text-[#888] text-xs mt-1 leading-relaxed">
              {TRANSLATIONS[language].selectBrokerDraftDesc}
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-full bg-[#111] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] text-xs font-bold mb-3">3</div>
            <h4 className="font-bold text-white text-sm flex items-center gap-1">{TRANSLATIONS[language].transmitUpdate} <CheckCircle2 size={12} className="text-[#d4af37]" /></h4>
            <p className="text-[#888] text-xs mt-1 leading-relaxed">
              {TRANSLATIONS[language].transmitUpdateDesc}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
