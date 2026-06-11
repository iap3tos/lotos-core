import React, { useRef, useState, useEffect } from 'react';
import { ProfileDetails, TrackingData, HistoryItem, Broker } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { Download, Upload, Trash2, History, ShieldAlert, Sparkles, HelpCircle, HardDrive, Cpu, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { toGreekUppercase } from '../utils/greekUtils';

interface SettingsPanelProps {
  profile: ProfileDetails;
  trackingData: TrackingData;
  history: HistoryItem[];
  onImportBackup: (profile: ProfileDetails, trackingData: TrackingData, history: HistoryItem[]) => void;
  onPurgeData: () => void;
  language: Language;
  isAuthRequired: boolean;
  brokers: Broker[];
  onUpdateBrokers: (brokers: Broker[]) => void;
  sweepIntervalHours: number;
  disableInternalSweep: boolean;
  lastSweepTime: number;
  onUpdateSweepSettings: (interval: number, disabled: boolean) => void;
}

const validateBrokers = (data: any): data is Broker[] => {
  if (!Array.isArray(data)) return false;
  return data.every(b => 
    typeof b === 'object' && b !== null &&
    typeof b.id === 'string' && b.id.trim() !== '' &&
    typeof b.name === 'string' && b.name.trim() !== '' &&
    typeof b.domain === 'string' && b.domain.trim() !== '' &&
    Array.isArray(b.regions) && b.regions.every((r: any) => typeof r === 'string') &&
    Array.isArray(b.instructions) && b.instructions.every((i: any) => typeof i === 'string') &&
    ['Email', 'Web Form', 'Both', 'Mail/Phone'].includes(b.optOutMethod)
  );
};

export default function SettingsPanel({
  profile,
  trackingData,
  history,
  onImportBackup,
  onPurgeData,
  language,
  isAuthRequired,
  brokers,
  onUpdateBrokers,
  sweepIntervalHours,
  disableInternalSweep,
  lastSweepTime,
  onUpdateSweepSettings,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brokerFileInputRef = useRef<HTMLInputElement>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [brokerImportFeedback, setBrokerImportFeedback] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Duplicates modal states
  const [duplicateBrokers, setDuplicateBrokers] = useState<Broker[]>([]);
  const [pendingImportList, setPendingImportList] = useState<Broker[]>([]);

  // Settings states
  const [localInterval, setLocalInterval] = useState(sweepIntervalHours);
  const [localDisabled, setLocalDisabled] = useState(disableInternalSweep);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [isSweeping, setIsSweeping] = useState(false);

  useEffect(() => {
    setLocalInterval(sweepIntervalHours);
    setLocalDisabled(disableInternalSweep);
  }, [sweepIntervalHours, disableInternalSweep]);

  // Trigger JSON file downloads
  const handleExportBackup = () => {
    try {
      setExportError(null);
      const backupPayload = {
        app: 'Lotos',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        profiles: [profile],
        trackingData,
        history,
        brokers,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lotos-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (err: any) {
      setExportError(language === 'el' ? `Η εξαγωγή απέτυχε: ${err.message || err}` : `Export failed: ${err.message || err}`);
      setTimeout(() => setExportError(null), 5000);
    }
  };

  // Process JSON file imports
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);

        // Simple validation checks and backward compatibility mapping
        let importedProfile: ProfileDetails | null = null;
        if (backup.profiles && Array.isArray(backup.profiles) && backup.profiles.length > 0) {
          importedProfile = backup.profiles[0];
        } else if (backup.profile) {
          importedProfile = backup.profile;
        }

        if (!importedProfile || !backup.trackingData || !backup.history) {
          throw new Error(language === 'el' ? 'Η δομή του αρχείου JSON δεν αντιστοιχεί στα απαιτούμενα μοντέλα της εφαρμογής Λωτός.' : 'JSON scheme does not match required Lotos tracking models.');
        }

        if (backup.brokers && Array.isArray(backup.brokers)) {
          onUpdateBrokers(backup.brokers);
        }

        onImportBackup(importedProfile, backup.trackingData, backup.history);
        const successMsg = language === 'el'
          ? `✅ Επιτυχής εισαγωγή αντιγράφου ασφαλείας με προφίλ και καταγραφές προόδου.`
          : `✅ Successfully imported backup containing profile and progress logs.`;
        setImportFeedback(successMsg);
        setTimeout(() => setImportFeedback(null), 6000);
      } catch (err: any) {
        const failMsg = language === 'el'
          ? `❌ Η εισαγωγή απέτυχε: ${err.message || 'Κατεστραμμένο αρχείο JSON'}`
          : `❌ Import Failed: ${err.message || 'Malformed JSON file details'}`;
        setImportFeedback(failMsg);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executePurge = () => {
    setShowPurgeConfirm(false);
    onPurgeData();
    setPurgeSuccess(true);
    setTimeout(() => setPurgeSuccess(false), 5000);
  };

  // Standalone broker export & import functionality
  const handleExportBrokers = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brokers, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lotos-brokers-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (err: any) {
      setBrokerImportFeedback(language === 'el' ? `Η εξαγωγή απέτυχε` : `Export failed`);
      setTimeout(() => setBrokerImportFeedback(null), 5000);
    }
  };

  const handleImportBrokersClick = () => {
    brokerFileInputRef.current?.click();
  };

  const handleBrokerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);

        if (!validateBrokers(imported)) {
          throw new Error(TRANSLATIONS[language].invalidBrokerFile);
        }

        // Scan for duplicate broker IDs
        const currentIds = new Set(brokers.map(b => b.id));
        const dupes = imported.filter(b => currentIds.has(b.id));

        if (dupes.length > 0) {
          setDuplicateBrokers(dupes);
          setPendingImportList(imported);
        } else {
          const merged = [...brokers, ...imported];
          onUpdateBrokers(merged);
          setBrokerImportFeedback(TRANSLATIONS[language].importBrokersSuccess);
          setTimeout(() => setBrokerImportFeedback(null), 5000);
        }
      } catch (err: any) {
        setBrokerImportFeedback(TRANSLATIONS[language].invalidBrokerFile);
        setTimeout(() => setBrokerImportFeedback(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmOverwrite = () => {
    const incomingIds = new Set(pendingImportList.map(b => b.id));
    const keptCurrent = brokers.filter(b => !incomingIds.has(b.id));
    const merged = [...keptCurrent, ...pendingImportList];
    
    onUpdateBrokers(merged);
    setDuplicateBrokers([]);
    setPendingImportList([]);
    setBrokerImportFeedback(TRANSLATIONS[language].importBrokersSuccess);
    setTimeout(() => setBrokerImportFeedback(null), 5000);
  };

  const cancelOverwrite = () => {
    setDuplicateBrokers([]);
    setPendingImportList([]);
  };

  const handleSaveSettings = () => {
    onUpdateSweepSettings(localInterval, localDisabled);
    setSettingsFeedback(
      language === 'el' 
        ? '✅ Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!' 
        : '✅ Settings saved successfully!'
    );
    setTimeout(() => setSettingsFeedback(null), 5000);
  };

  const handleManualSweep = async () => {
    setIsSweeping(true);
    setSettingsFeedback(null);
    try {
      const res = await fetch('/api/cron/sweep');
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsFeedback(
          language === 'el' 
            ? '✅ Η σάρωση ολοκληρώθηκε επιτυχώς!' 
            : '✅ Sweep completed successfully!'
        );
        onUpdateSweepSettings(localInterval, localDisabled);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setSettingsFeedback(
        language === 'el'
          ? `❌ Αποτυχία σάρωσης: ${err.message || err}`
          : `❌ Sweep failed: ${err.message || err}`
      );
    } finally {
      setIsSweeping(false);
      setTimeout(() => setSettingsFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="settings-tab">
      
      {/* Header section */}
      <div className="border-b border-[#1a1a1a] pb-5">
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">{toGreekUppercase(TRANSLATIONS[language].vaultGovernance)}</span>
        <h1 className="text-2xl md:text-3xl font-serif text-[#e5e5e5] mt-1">
          {TRANSLATIONS[language].settingsGovernance}
        </h1>
        <p className="text-xs text-[#666] mt-1">
          {TRANSLATIONS[language].settingsDesc}
        </p>
      </div>

      {/* Warning alert if auth is not configured */}
      {!isAuthRequired && (
        <div className="bg-amber-955/15 border border-amber-900/40 rounded-xl p-4 flex gap-3.5 items-start font-sans">
          <ShieldAlert className="text-[#d4af37] shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {language === 'el' ? '⚠️ ΑΦΥΛΑΚΤΟΣ ΠΙΝΑΚΑΣ ΕΛΕΓΧΟΥ' : '⚠️ UNSECURED DASHBOARD'}
            </h4>
            <p className="text-[11px] text-[#888] leading-relaxed">
              {language === 'el'
                ? 'Δεν έχει οριστεί κωδικός πρόσβασης (passcode) στο αρχείο .env. Εάν αυτός ο διακομιστής είναι προσβάσιμος στο τοπικό σας δίκτυο ή στο διαδίκτυο, τα προσωπικά σας στοιχεία και η πρόσβαση στο Gmail είναι εκτεθειμένα. Προσθέστε το LOTOS_PASSWORD στο αρχείο .env για να κλειδώσετε την εφαρμογή.'
                : 'No passcode is set in your .env file. If this instance is accessible on your local network or the internet, your personal coordinates and Gmail integration are exposed. Please configure LOTOS_PASSWORD in your .env file to secure this dashboard.'}
            </p>
          </div>
        </div>
      )}

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Data Backup & Synchronization */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#1a1a1a]/60 pb-3 mb-1">
            <HardDrive size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-serif text-white uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].durableBackups)}</h3>
          </div>

          <p className="text-xs text-[#888] leading-relaxed">
            {TRANSLATIONS[language].backupsDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="flex-1 bg-[#d4af37] hover:bg-[#c4a030] text-black text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> {TRANSLATIONS[language].exportBackup}
            </button>

            <button
              onClick={handleImportClick}
              className="flex-1 bg-[#111] border border-[#1a1a1a] hover:bg-[#1a1a1a] text-[#888] hover:text-white hover:border-[#d4af37]/30 text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> {TRANSLATIONS[language].importBackup}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {exportError && (
            <div className="p-3 rounded-lg text-xs font-semibold font-sans mt-3 bg-red-950/20 text-red-400 border border-red-900/30">
              ⚠️ {exportError}
            </div>
          )}

          {importFeedback && (
            <div className={`p-3 rounded-lg text-xs leading-relaxed font-semibold font-sans mt-3 ${importFeedback.includes('❌') ? 'bg-red-950/20 text-red-400 border border-red-900/30' : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'}`}>
              {importFeedback}
            </div>
          )}
        </div>

        {/* Panel 2: Cache Evacuation / Wipe Vault */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-5 flex flex-col justify-between font-sans">
          <div>
            <div className="flex items-center gap-2 border-b border-[#1a1a1a]/60 pb-3 mb-1">
              <Trash2 size={18} className="text-red-400" />
              <h3 className="text-sm font-serif text-white uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].wipeWorkspace)}</h3>
            </div>

            <p className="text-xs text-[#888] leading-relaxed mt-3">
              {TRANSLATIONS[language].wipeWorkspaceDesc}
            </p>
          </div>

          <div className="pt-4 space-y-3 font-sans">
            {purgeSuccess && (
              <div className="p-3 rounded-lg text-xs font-semibold font-sans bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 flex items-center gap-2">
                <CheckCircle size={14} /> {TRANSLATIONS[language].localCacheWiped}
              </div>
            )}

            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="w-full bg-red-955/20 hover:bg-red-955/40 border border-red-900/40 text-red-400 text-xs font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <Trash2 size={14} /> {TRANSLATIONS[language].purgeWorkspaceBtn}
            </button>
          </div>
        </div>

        {/* Panel 3: Broker Directory Management */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-5 font-sans">
          <div className="flex items-center gap-2 border-b border-[#1a1a1a]/60 pb-3 mb-1">
            <Sparkles size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-serif text-white uppercase tracking-wider">{toGreekUppercase(TRANSLATIONS[language].brokerManagement)}</h3>
          </div>

          <p className="text-xs text-[#888] leading-relaxed">
            {TRANSLATIONS[language].brokerManagementDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleExportBrokers}
              className="flex-1 bg-[#111] border border-[#1a1a1a] hover:bg-[#1a1a1a] text-[#888] hover:text-white hover:border-[#d4af37]/30 text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <Download size={14} /> {TRANSLATIONS[language].exportBrokers}
            </button>

            <button
              onClick={handleImportBrokersClick}
              className="flex-1 bg-[#d4af37] hover:bg-[#c4a030] text-black text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <Upload size={14} /> {TRANSLATIONS[language].importBrokers}
            </button>
            <input
              type="file"
              ref={brokerFileInputRef}
              onChange={handleBrokerFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {brokerImportFeedback && (
            <div className={`p-3 rounded-lg text-xs leading-relaxed font-semibold font-sans mt-3 ${brokerImportFeedback.includes('❌') ? 'bg-red-950/20 text-red-400 border border-red-900/30' : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'}`}>
              {brokerImportFeedback}
            </div>
          )}
        </div>

        {/* Panel 4: Background Sweep Settings */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-5 font-sans">
          <div className="flex items-center gap-2 border-b border-[#1a1a1a]/60 pb-3 mb-1">
            <Cpu size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-serif text-white uppercase tracking-wider">
              {language === 'el' ? 'ΑΥΤΟΜΑΤΕΣ ΣΑΡΩΣΕΙΣ GMAIL' : 'AUTOMATED GMAIL SWEEPS'}
            </h3>
          </div>

          <p className="text-xs text-[#888] leading-relaxed">
            {language === 'el'
              ? 'Ρυθμίστε τη συχνότητα με την οποία ο Λωτός θα ελέγχει το Gmail σας στο υπόβαθρο για απαντήσεις από data brokers.'
              : 'Configure how frequently Lotos checks your Gmail inbox in the background for opt-out responses.'}
          </p>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!localDisabled}
                onChange={(e) => setLocalDisabled(!e.target.checked)}
                className="w-4 h-4 rounded border-[#1a1a1a] bg-black text-[#d4af37] focus:ring-[#d4af37]/30"
              />
              <span className="text-xs font-semibold text-white">
                {language === 'el' ? 'Ενεργοποίηση αυτόματων σαρώσεων' : 'Enable background sweeps'}
              </span>
            </label>

            {!localDisabled && (
              <div className="space-y-1.5">
                <span className="text-xs text-[#666] font-medium block">
                  {language === 'el' ? 'Συχνότητα σάρωσης (Ώρες):' : 'Sweep Interval (Hours):'}
                </span>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={localInterval}
                  onChange={(e) => setLocalInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full sm:w-32 bg-black border border-[#1a1a1a] text-white text-xs rounded-lg p-2.5 focus:border-[#d4af37]/50 focus:outline-none"
                />
              </div>
            )}

            <div className="text-[11px] text-[#666] flex flex-col gap-1">
              <div>
                {language === 'el' ? 'Τελευταία σάρωση:' : 'Last sweep run:'}{' '}
                <strong className="text-[#888]">
                  {lastSweepTime > 0 ? new Date(lastSweepTime).toLocaleString() : (language === 'el' ? 'Ποτέ' : 'Never')}
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSaveSettings}
                className="flex-1 bg-[#d4af37] hover:bg-[#c4a030] text-black text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                {language === 'el' ? 'Αποθήκευση Ρυθμίσεων' : 'Save Settings'}
              </button>

              <button
                onClick={handleManualSweep}
                disabled={isSweeping}
                className={`flex-1 bg-[#111] border border-[#1a1a1a] hover:bg-[#1a1a1a] text-[#888] hover:text-white hover:border-[#d4af37]/30 text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans ${isSweeping ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Cpu size={14} className={isSweeping ? 'animate-spin text-[#d4af37]' : ''} />
                {isSweeping 
                  ? (language === 'el' ? 'Σάρωση σε εξέλιξη...' : 'Sweeping...') 
                  : (language === 'el' ? 'Έναρξη Σάρωσης Τώρα' : 'Trigger Sweep Now')}
              </button>
            </div>

            {settingsFeedback && (
              <div className={`p-3 rounded-lg text-xs leading-relaxed font-semibold font-sans mt-3 ${settingsFeedback.includes('❌') ? 'bg-red-955/20 text-red-400 border border-red-900/30' : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'}`}>
                {settingsFeedback}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Custom Confirmation Modal Overlay */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-purge-modal">
          <div className="bg-[#0a0a0a] border border-red-900/40 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="p-3 bg-red-955/40 text-red-400 rounded-full border border-red-900/30">
                <AlertTriangle size={24} />
              </span>
              <div>
                <h3 className="text-lg font-serif text-white">{TRANSLATIONS[language].wipeConfirmTitle}</h3>
                <p className="text-xs text-[#888] mt-1.5 leading-relaxed font-sans">
                  {TRANSLATIONS[language].wipeConfirmDesc}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-[#888] hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer font-sans"
              >
                {TRANSLATIONS[language].abort}
              </button>
              <button
                onClick={executePurge}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <Trash2 size={13} /> {TRANSLATIONS[language].yesPurge}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateBrokers.length > 0 && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="duplicate-warning-modal">
          <div className="bg-[#0a0a0a] border border-amber-900/40 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="p-3 bg-amber-955/40 text-[#d4af37] rounded-full border border-amber-900/30">
                <AlertTriangle size={24} />
              </span>
              <div>
                <h3 className="text-lg font-serif text-white">{TRANSLATIONS[language].duplicateWarningTitle}</h3>
                <p className="text-xs text-[#888] mt-1.5 leading-relaxed font-sans">
                  {TRANSLATIONS[language].duplicateWarningDesc}
                </p>
                <div className="mt-3 max-h-40 overflow-y-auto border border-[#1a1a1a] rounded-lg p-2 bg-black/45 space-y-1 text-[11px] text-white font-mono">
                  {duplicateBrokers.map(b => (
                    <div key={b.id} className="flex justify-between">
                      <span>{b.name}</span>
                      <span className="text-[#666]">({b.id})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={cancelOverwrite}
                className="px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-[#888] hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer font-sans"
              >
                {TRANSLATIONS[language].cancel}
              </button>
              <button
                onClick={confirmOverwrite}
                className="px-4 py-2 bg-[#d4af37] hover:bg-[#c4a030] text-black rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                {TRANSLATIONS[language].overwriteProceed}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured FAQ or Education on Incogni comparison */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-[#1a1a1a]/60 pb-2.5">
          <HelpCircle size={20} className="text-[#d4af37]" />
          <h3 className="text-base font-serif text-white">{TRANSLATIONS[language].technicalGovernanceGuide}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-sans">
          
          <div className="space-y-1.5 bg-black/40 border border-[#1a1a1a] p-4 rounded-xl">
            <h4 className="font-serif font-semibold text-[#d4af37]">{TRANSLATIONS[language].faq1Title}</h4>
            <p className="text-[#888] leading-relaxed font-sans">
              {TRANSLATIONS[language].faq1Desc}
            </p>
          </div>

          <div className="space-y-1.5 bg-black/40 border border-[#1a1a1a] p-4 rounded-xl">
            <h4 className="font-serif font-semibold text-[#d4af37]">{TRANSLATIONS[language].faq2Title}</h4>
            <p className="text-[#888] leading-relaxed font-sans">
              {TRANSLATIONS[language].faq2Desc}
            </p>
          </div>

          <div className="space-y-1.5 bg-black/40 border border-[#1a1a1a] p-4 rounded-xl">
            <h4 className="font-serif font-semibold text-[#d4af37]">{TRANSLATIONS[language].faq3Title}</h4>
            <p className="text-[#888] leading-relaxed font-sans">
              {TRANSLATIONS[language].faq3Desc}
            </p>
          </div>

          <div className="space-y-1.5 bg-black/40 border border-[#1a1a1a] p-4 rounded-xl">
            <h4 className="font-serif font-semibold text-[#d4af37] flex items-center gap-1">{TRANSLATIONS[language].faq4Title} <Cpu size={14} className="text-[#6ff]" /></h4>
            <p className="text-[#888] leading-relaxed font-sans">
              {TRANSLATIONS[language].faq4Desc}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
