import React, { useState, useEffect, useRef } from 'react';
import { Lock, Shield, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { toGreekUppercase } from '../utils/greekUtils';

interface LoginProps {
  language: 'el' | 'en';
  onLoginSuccess: () => void;
}

export default function Login({ language, onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the password input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess();
      } else {
        setError(
          data.error || 
          (language === 'el' 
            ? 'Αποτυχία σύνδεσης. Ελέγξτε τον κωδικό σας.' 
            : 'Login failed. Please check your passcode.')
        );
      }
    } catch (err: any) {
      setError(
        language === 'el'
          ? 'Σφάλμα σύνδεσης με τον διακομιστή.'
          : 'Failed to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const strings = {
    title: language === 'el' ? 'Λωτός Core' : 'Lotos Core',
    subtitle: language === 'el' ? 'Ιδιωτικός Χώρος Απομόνωσης' : 'Personal Privacy Workspace',
    description: language === 'el' 
      ? 'Αυτός ο τοπικός διακομιστής είναι προστατευμένος. Εισάγετε τον κωδικό πρόσβασης για να ξεκλειδώσετε το τερματικό σας.'
      : 'This self-hosted instance is protected. Please enter your passcode to unlock your dashboard.',
    placeholder: language === 'el' ? 'Κωδικός Πρόσβασης' : 'Passcode',
    button: language === 'el' ? 'Ξεκλείδωμα' : 'Unlock Dashboard',
    footer: language === 'el'
      ? 'Προστατεύεται από τοπικό Session Cookie. Μηδενική καταγραφή τρίτων.'
      : 'Protected by local HTTP session cookie. Zero third-party analytics.'
  };

  return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative premium background elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-radial from-[#d4af37]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-radial from-neutral-900 to-transparent blur-3xl pointer-events-none" />

      {/* Main glassmorphism card */}
      <div className="max-w-md w-full bg-[#0a0a0a]/80 border border-[#1a1a1a] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Top gold header accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />

        {/* Shield Icon and Branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#111] border border-[#d4af37]/25 flex items-center justify-center text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <Shield size={26} className="animate-pulse" />
          </div>
          
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#d4af37] uppercase">
              {language === 'el' ? toGreekUppercase(strings.subtitle) : strings.subtitle.toUpperCase()}
            </span>
            <h1 className="text-2xl font-serif text-[#e5e5e5] mt-1 tracking-tight">
              {strings.title}
            </h1>
          </div>

          <p className="text-xs text-[#888] leading-relaxed max-w-sm">
            {strings.description}
          </p>
        </div>

        {/* Passcode Entry Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#444] pointer-events-none">
                <Lock size={15} />
              </span>
              <input
                ref={inputRef}
                type="password"
                required
                autoComplete="off"
                placeholder={strings.placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-[#050505] border border-[#1a1a1a] focus:border-[#d4af37]/45 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-[#444]"
              />
            </div>
          </div>

          {/* Validation Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-xs text-red-400 flex gap-2.5 items-start animate-shake">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] hover:bg-[#c4a030] disabled:bg-[#d4af37]/50 disabled:cursor-not-allowed text-[#050505] font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider shadow-md"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {language === 'el' ? toGreekUppercase('Επαλήθευση...') : 'Verifying...'}
              </>
            ) : (
              <>
                {language === 'el' ? toGreekUppercase(strings.button) : strings.button.toUpperCase()}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Badge */}
        <div className="mt-8 pt-5 border-t border-[#1a1a1a]/55 text-center">
          <span className="text-[10px] text-[#555] font-mono leading-relaxed block">
            {strings.footer}
          </span>
        </div>
      </div>
    </div>
  );
}
