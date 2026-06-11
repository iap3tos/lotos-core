import React, { useState, useEffect } from 'react';
import { ProfileDetails } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { Save, ShieldCheck, Mail, AlertTriangle, Info, LogOut, Sparkles } from 'lucide-react';
import { toGreekUppercase } from '../utils/greekUtils';

interface PersonalProfileProps {
  profile: ProfileDetails;
  onUpdateProfile: (profile: Partial<ProfileDetails>) => void;
  language: Language;
  
  // Google Auth props
  googleToken: string | null;
  googleUser: { name: string; email: string; picture?: string } | null;
  onGoogleSignOut: () => void;
  onStartGoogleAuth: () => void;
  isAuthorizing: boolean;
  authError: string | null;

  // Wizard props
  wizardDismissed: boolean;
  onRestoreWizard: () => void;
}

export default function PersonalProfile({
  profile,
  onUpdateProfile,
  language,
  googleToken,
  googleUser,
  onGoogleSignOut,
  onStartGoogleAuth,
  isAuthorizing,
  authError,
  wizardDismissed,
  onRestoreWizard
}: PersonalProfileProps) {
  const activeProfile = profile || {
    id: 'default',
    name: '',
    email: '',
    alternativeEmails: [],
    phone: '',
    state: 'Attica (EU GDPR)',
    city: '',
    address: '',
    postalCode: ''
  };

  // Profile Form States
  const [name, setName] = useState(activeProfile.name || '');
  const [latinName, setLatinName] = useState(activeProfile.latinName || '');
  const [email, setEmail] = useState(activeProfile.email || '');
  const [altEmailInput, setAltEmailInput] = useState('');
  const [alternativeEmails, setAlternativeEmails] = useState<string[]>(activeProfile.alternativeEmails || []);
  const [phone, setPhone] = useState(activeProfile.phone || '');
  const [state, setState] = useState(activeProfile.state || 'Attica (EU GDPR)');
  const [city, setCity] = useState(activeProfile.city || '');
  const [address, setAddress] = useState(activeProfile.address || '');
  const [postalCode, setPostalCode] = useState(activeProfile.postalCode || '');

  // Keep state synced with profile updates
  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name || '');
      setLatinName(activeProfile.latinName || '');
      setEmail(activeProfile.email || '');
      setAlternativeEmails(activeProfile.alternativeEmails || []);
      setPhone(activeProfile.phone || '');
      setState(activeProfile.state || 'Attica (EU GDPR)');
      setCity(activeProfile.city || '');
      setAddress(activeProfile.address || '');
      setPostalCode(activeProfile.postalCode || '');
    }
  }, [activeProfile.id]);

  const handleApplyChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onUpdateProfile({
      name,
      latinName,
      email,
      alternativeEmails,
      phone,
      state,
      city,
      address,
      postalCode
    });

    const successToast = document.getElementById('save-toast');
    if (successToast) {
      successToast.style.opacity = '1';
      setTimeout(() => {
        successToast.style.opacity = '0';
      }, 3000);
    }
  };

  const addAlternativeEmail = () => {
    if (altEmailInput.trim() && altEmailInput.includes('@')) {
      if (!alternativeEmails.includes(altEmailInput.trim())) {
        setAlternativeEmails([...alternativeEmails, altEmailInput.trim()]);
      }
      setAltEmailInput('');
    }
  };

  const removeAlternativeEmail = (indexToRemove: number) => {
    setAlternativeEmails(alternativeEmails.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="profile-pane">
      
      {/* Upper header */}
      <div className="border-b border-[#1a1a1a] pb-5">
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">
          {language === 'el' ? 'ΠΡΟΣΩΠΙΚΟΣ ΧΩΡΟΣ ΕΝΕΡΓΕΙΩΝ' : 'PERSONAL ACTION VAULT'}
        </span>
        <h1 className="text-2xl md:text-3xl font-serif text-[#e5e5e5] mt-1">
          {language === 'el' ? '👤 Το Προφίλ μου' : '👤 My Profile'}
        </h1>
        <p className="text-xs text-[#666] mt-1 leading-relaxed">
          {language === 'el' 
            ? 'Διαχειριστείτε τα προσωπικά σας στοιχεία ταυτότητας που χρησιμοποιούνται για τη σύνταξη και την αυτόματη αποστολή αιτημάτων διαγραφής μέσω Gmail.'
            : 'Manage your personal identity credentials used to draft and automatically dispatch suppression filings via Gmail.'}
        </p>
      </div>

      {/* Grid layouts splitting Google Auth from Profile Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Column: Google Authorization Status */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs flex flex-col justify-between h-auto gap-4">
            <div>
              <span className="text-[9px] bg-black border border-[#1a1a1a] text-[#888] font-mono tracking-widest px-2 py-0.5 rounded uppercase font-semibold">
                {language === 'el' ? 'ΣΥΝΔΕΣΗ GOOGLE' : 'GOOGLE SECURITY CONNECTION'}
              </span>
              <h3 className="text-base font-serif text-white tracking-tight mt-3">
                {language === 'el' ? 'Εξουσιοδότηση Gmail & Λογαριασμού' : 'Authorize Gmail & Account'}
              </h3>
              <p className="text-xs text-[#666] mt-1.5 leading-relaxed">
                {language === 'el'
                  ? 'Συνδέστε τον προσωπικό σας λογαριασμό Google για να επιτρέψετε στον Λωτό να στέλνει αιτήματα opt-out ψηφιακά και να σκανάρει αυτόματα τον φάκελο εισερχομένων σας για απαντήσεις data brokers.'
                  : 'Connect your personal Google account to authorize Lotos to send suppression emails digitally and scan your secure inbox for responses automatically.'}
              </p>
            </div>

            {/* Authorization Action State view */}
            {googleUser ? (
              <div className="bg-black border border-[#d4af37]/20 rounded-lg p-3.5 space-y-3.5">
                <div className="flex items-center gap-3">
                  {googleUser.picture ? (
                    <img 
                      src={googleUser.picture} 
                      alt={googleUser.name} 
                      className="w-10 h-10 rounded-full border border-[#1a1a1a]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-[#d4af37] font-serif font-black text-xs">
                      {googleUser.name ? googleUser.name.charAt(0) : 'G'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{googleUser.name}</p>
                    <p className="text-[10px] text-[#666] truncate font-mono mt-0.5">{googleUser.email}</p>
                  </div>
                </div>

                <div className="border-t border-[#1a1a1a] pt-3 flex flex-col gap-1.5 text-[10px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 leading-tight">
                    <ShieldCheck size={12} /> {language === 'el' ? 'Ενεργή Εξουσιοδότηση Gmail (API)' : 'Gmail dispatch active (API)'}
                  </span>
                  <span className="text-[#555]">
                    {language === 'el' ? 'Μόνο εσείς έχετε πρόσβαση στα κλειδιά μνήμης.' : 'Token is cached purely in-memory.'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignOut}
                  className="w-full mt-1.5 bg-[#111] hover:bg-neutral-900 border border-[#1a1a1a] hover:border-red-950 text-xs text-[#888] hover:text-red-400 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut size={13} /> {language === 'el' ? 'Αποσύνδεση Λογαριασμού' : 'Disconnect Google'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onStartGoogleAuth}
                  disabled={isAuthorizing}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#d4af37]/30 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer text-xs"
                >
                  <Mail size={16} className="text-[#d4af37]" />
                  {isAuthorizing 
                    ? (language === 'el' ? 'Επικοινωνία με Google...' : 'Connecting Google...') 
                    : (language === 'el' ? 'Σύνδεση με Google Account' : 'Sign in with Google')}
                </button>

                {authError && (
                  <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-xs text-red-400 flex gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-[#1a1a1a]/40 text-[10px] text-[#555] leading-relaxed">
              <span className="font-bold block text-white uppercase mb-1">
                {language === 'el' ? '🔒 ΜΗ ΚΡΑΤΙΚΟ - ΑΠΟΚΛΕΙΣΤΙΚΑ SECURED' : '🔒 SELF-HOSTED ISOLATION SECURITY'}
              </span>
              {language === 'el'
                ? 'Κανένα στοιχείο πρόσβασης ή email δεν αποστέλλεται σε εμπορικούς cloud servers. Όλα τα tokens αποθηκεύονται αποκλειστικά στη μνήμη RAM του προγράμματος περιήγησής σας.'
                : 'No authentication credentials or variables are ever written to external servers. All access tokens stay strictly local in ephemeral memory.'}
            </div>

            {wizardDismissed && (
              <div className="pt-3 border-t border-[#1a1a1a]/40 space-y-2">
                <span className="font-bold block text-white text-[10px] uppercase">
                  {language === 'el' ? '✨ ΟΔΗΓΟΣ ΕΓΚΑΤΑΣΤΑΣΗΣ' : '✨ SETUP WIZARD'}
                </span>
                <p className="text-[10px] text-[#888] leading-relaxed font-sans">
                  {language === 'el'
                    ? 'Ο οδηγός εγκατάστασης της αρχικής σελίδας έχει αποκρυφθεί. Μπορείτε να τον επαναφέρετε αν θέλετε να κάνετε σύνδεση.'
                    : 'The dashboard setup wizard banner has been hidden. You can restore it if you wish to integrate now.'}
                </p>
                <button
                  type="button"
                  onClick={onRestoreWizard}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#d4af37]/30 hover:border-[#d4af37]/60 text-[#d4af37] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                >
                  <Sparkles size={11} />
                  {toGreekUppercase(language === 'el' ? 'Επαναφορά Οδηγού & Μετάβαση' : 'Restore Wizard & Configure')}
                </button>
              </div>
            )}
          </div>

          {/* Optional Manual Workflow Information Card */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#d4af37]">
              <Info size={14} className="shrink-0" />
              <h4 className="font-serif text-white text-xs font-bold uppercase tracking-wider">
                {toGreekUppercase(language === 'el' ? 'Μη Αυτόματη / Τοπική Λειτουργία' : 'Manual Deletion Option')}
              </h4>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed">
              {language === 'el'
                ? 'Η σύνδεση με το Google Account είναι εντελώς προαιρετική. Εάν προτιμάτε 100% τοπική διαχείριση χωρίς καμία εξωτερική σύνδεση, μπορείτε να χρησιμοποιήσετε την εφαρμογή ως εξής:'
                : 'Connecting a Google Account is completely optional. If you prefer manual execution with zero external integrations, you can operate Lotos fully offline:'}
            </p>
            <ul className="text-[10px] text-[#666] space-y-2 list-none pl-0">
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-[#d4af37] select-none font-bold">1.</span>
                <span>
                  {language === 'el' 
                    ? 'Συμπληρώστε τα στοιχεία σας στη φόρμα δεξιά και πατήστε Εφαρμογή Αλλαγών.' 
                    : 'Fill out your identity credentials in the form to the right and save.'}
                </span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-[#d4af37] select-none font-bold">2.</span>
                <span>
                  {language === 'el' 
                    ? 'Επιλέξτε οποιονδήποτε broker από τον Κατάλογο Διαγραφών.' 
                    : 'Select any data broker listed inside the Suppression Directory.'}
                </span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-[#d4af37] select-none font-bold">3.</span>
                <span>
                  {language === 'el' 
                    ? 'Αντιγράψτε το έτοιμο email, χρησιμοποιήστε το "Αποστολή θυρίδας" (mailto link) ή το "Άνοιγμα Φόρμας".' 
                    : 'Copy the compiled email draft, trigger the "Dispatch Mailbox" link, or visit the opt-out web forms.'}
                </span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-[#d4af37] select-none font-bold">4.</span>
                <span>
                  {language === 'el' 
                    ? 'Ενημερώστε την κατάσταση χειροκίνητα για την παρακολούθηση της προόδου σας.' 
                    : 'Update individual tracking flags manually to keep detailed trace reports.'}
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Right Side Column: Demographic Form Details */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 shadow-xs lg:col-span-2">
          
          <div className="flex border-b border-[#1a1a1a]/60 pb-3 mb-5 justify-between items-center">
            <h3 className="font-serif text-[#e5e5e5] text-base">
              {language === 'el' ? '✏️ Στοιχεία Ταυτότητας & Επικοινωνίας' : '✏️ Profile Identity Details'}
            </h3>
            <span className="text-[10px] text-[#555] font-mono tracking-widest uppercase">{activeProfile.id.toUpperCase()}</span>
          </div>

          <form onSubmit={handleApplyChanges} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Legal Name */}
              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">
                  {toGreekUppercase(TRANSLATIONS[language].fullLegalName)} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder={language === 'el' ? 'π.χ. Ιωάννης Παπαδόπουλος' : 'e.g. John Albert Doe'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all placeholder:text-[#444]"
                />
                <p className="text-[10px] text-[#555] mt-1">{TRANSLATIONS[language].middleNameNotice}</p>
              </div>

              {/* Latin / English Legal Name */}
              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">
                  {toGreekUppercase(TRANSLATIONS[language].latinName)}
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder={language === 'el' ? 'π.χ. Ioannis Papadopoulos' : 'e.g. John Albert Doe'}
                  value={latinName}
                  onChange={e => setLatinName(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all placeholder:text-[#444]"
                />
                <p className="text-[10px] text-[#555] mt-1">{TRANSLATIONS[language].latinNameNotice}</p>
              </div>

              {/* Primary Email */}
              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">
                  {toGreekUppercase(TRANSLATIONS[language].primaryEmail)} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="name@mail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all placeholder:text-[#444]"
                />
                <p className="text-[10px] text-[#555] mt-1">{TRANSLATIONS[language].primaryEmailNotice}</p>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">
                  {toGreekUppercase(TRANSLATIONS[language].contactPhone)}
                </label>
                <input
                  type="tel"
                  autoComplete="off"
                  placeholder="+30 690 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all placeholder:text-[#444]"
                />
                <p className="text-[10px] text-[#555] mt-1">{TRANSLATIONS[language].phoneNotice}</p>
              </div>

              {/* State */}
              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">
                  {toGreekUppercase(TRANSLATIONS[language].jurisdiction)}
                </label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full bg-[#050505] text-[#e5e5e5] border border-[#1a1a1a] rounded-lg px-3.5 py-2 text-xs focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Attica (EU GDPR)" className="bg-[#050505] text-[#e5e5e5]">
                    {language === 'el' ? 'Αττική, Ελλάδα (GDPR)' : 'Attica, Greece (GDPR)'}
                  </option>
                  <option value="Central Macedonia (EU GDPR)" className="bg-[#050505] text-[#e5e5e5]">
                    {language === 'el' ? 'Κεντρική Μακεδονία, Ελλάδα (GDPR)' : 'Central Macedonia, Greece (GDPR)'}
                  </option>
                  <option value="Crete (EU GDPR)" className="bg-[#050505] text-[#e5e5e5]">
                    {language === 'el' ? 'Κρήτη, Ελλάδα (GDPR)' : 'Crete, Greece (GDPR)'}
                  </option>
                  <option value="EU" className="bg-[#050505] text-[#e5e5e5]">
                    {language === 'el' ? 'Άλλη Χώρα Ευρωπαϊκής Ένωσης (GDPR)' : 'Other European Union (GDPR)'}
                  </option>
                  <option value="CA" className="bg-[#050505] text-[#e5e5e5]">
                    {language === 'el' ? 'Καλιφόρνια, ΗΠΑ (CCPA)' : 'California, US (CCPA)'}
                  </option>
                  <option value="Other" className="bg-[#050505] text-[#e5e5e5]">
                    {language === 'el' ? 'Άλλη Διεθνής Δικαιοδοσία' : 'Other US / International'}
                  </option>
                </select>
                <p className="text-[10px] text-[#555] mt-1">{TRANSLATIONS[language].jurisdictionNotice}</p>
              </div>

            </div>

            {/* Address Details */}
            <div className="border-t border-[#1a1a1a] pt-4 space-y-4">
              <h4 className="text-xs font-serif text-white">{TRANSLATIONS[language].historicalAddress}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-semibold text-[#666] uppercase tracking-widest mb-1">{toGreekUppercase(TRANSLATIONS[language].streetAddress)}</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={language === 'el' ? 'π.χ. Πανεπιστημίου 12, Διαμ. 4' : 'e.g. 104 Private Lane, Bldg'}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/40 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-[#666] uppercase tracking-widest mb-1">{toGreekUppercase(TRANSLATIONS[language].cityLabel)}</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={language === 'el' ? 'π.χ. Αθήνα' : 'e.g. Athens'}
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/40 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-[#666] uppercase tracking-widest mb-1">{toGreekUppercase(TRANSLATIONS[language].zipCode)}</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. 10123"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/40 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Alternative Email tags input */}
            <div className="border-t border-[#1a1a1a] pt-4">
              <label className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-1.5">
                {toGreekUppercase(TRANSLATIONS[language].alternativeEmails)}
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. old.email@domain.com"
                  value={altEmailInput}
                  onChange={e => setAltEmailInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlternativeEmail(); } }}
                  className="flex-1 bg-[#050505] border border-[#1a1a1a] rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={addAlternativeEmail}
                  className="bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] px-3.5 rounded-lg text-[#d4af37] transition-all flex items-center justify-center cursor-pointer font-black"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-[#555] mt-1">{TRANSLATIONS[language].alternativeEmailsNotice}</p>
              
              {alternativeEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {alternativeEmails.map((alt, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-black border border-[#1a1a1a] text-[#888] text-xs rounded-full">
                      {alt}
                      <button
                        type="button"
                        onClick={() => removeAlternativeEmail(index)}
                        className="text-[#444] hover:text-[#d4af37] hover:bg-[#111] rounded-full px-1 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action Block */}
            <div className="flex justify-end gap-2 border-t border-[#1a1a1a] pt-5 mt-4 items-center">
              <div id="save-toast" className="opacity-0 transition-opacity duration-300 mr-4 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck size={14} /> {language === 'el' ? 'Αλλαγές αποθηκεύτηκαν ασφαλώς!' : 'Profile updated securely!'}
              </div>
              
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#c4a030] text-[#050505] font-black rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Save size={14} /> {toGreekUppercase(TRANSLATIONS[language].applyUpdates)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
