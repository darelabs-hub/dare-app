import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { DareDayLogo } from './DareDayLogo';
import { playSound } from '../utils/soundEffects';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: () => Promise<any>;
  onSignInWithEmail: (email: string, pass: string) => Promise<any>;
  onSignUpWithEmail: (email: string, pass: string, handle?: string) => Promise<any>;
  onResetPassword?: (email: string) => Promise<{ success: boolean; error?: string }>;
  onSignInAsGuest?: (handle?: string) => Promise<any>;
  authError?: string | null;
  onClearError?: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignInWithGoogle,
  onSignInWithEmail,
  onSignUpWithEmail,
  onResetPassword,
  authError,
  onClearError,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetSuccessMessage(null);
    onClearError?.();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (showForgotPassword) {
      if (!onResetPassword) {
        setLocalError('Password reset is currently unavailable.');
        return;
      }
      setLoading(true);
      try {
        const res = await onResetPassword(email.trim());
        if (res.success) {
          playSound('levelUp');
          setResetSuccessMessage(`Password reset link sent to ${email.trim()}! Please check your inbox.`);
          setShowForgotPassword(false);
        } else {
          setLocalError(res.error || 'Failed to send reset email.');
        }
      } catch (err: any) {
        setLocalError(err?.message || 'Failed to send reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      setLocalError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const res = await onSignUpWithEmail(email.trim(), password, handle.trim() || undefined);
        if (res?.user) {
          playSound('levelUp');
          onClose();
        }
      } else {
        const res = await onSignInWithEmail(email.trim(), password);
        if (res?.user) {
          playSound('levelUp');
          onClose();
        }
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    setResetSuccessMessage(null);
    onClearError?.();
    setLoading(true);
    try {
      const res = await onSignInWithGoogle();
      if (res?.user) {
        playSound('levelUp');
        onClose();
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0E101A] p-6 sm:p-8 shadow-[0_0_70px_rgba(255,0,180,0.25)] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with Circular Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <DareDayLogo size={68} variant="emblem" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            {showForgotPassword ? 'Reset Password' : isSignUp ? 'Join The Arena' : 'Enter The Arena'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            {showForgotPassword 
              ? 'Enter your account email to receive a password reset link.'
              : isSignUp 
                ? 'Create a verified profile to post dares, submit proofs, and stake Cred.'
                : 'Sign in to access your wagers, leaderboard rank, and active challenges.'}
          </p>
        </div>

        {/* Primary 1-Tap Action: Google Sign In */}
        {!showForgotPassword && (
          <>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-extrabold text-sm transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] cursor-pointer disabled:opacity-50 border border-slate-200"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                <span className="bg-[#0E101A] px-3 text-slate-500">Or with email</span>
              </div>
            </div>
          </>
        )}

        {/* Status Messages */}
        {currentError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{currentError}</span>
          </div>
        )}

        {resetSuccessMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{resetSuccessMessage}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {isSignUp && !showForgotPassword && (
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-1">
                Challenger Handle
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. dare_ninja"
                  className="w-full rounded-xl bg-[#161826] border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#FF007F] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operative@domain.com"
                required
                className="w-full rounded-xl bg-[#161826] border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#FF007F] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {!showForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-300">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setLocalError(null);
                    }}
                    className="text-[11px] text-pink-400 hover:text-pink-300 cursor-pointer font-mono"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!showForgotPassword}
                  minLength={6}
                  className="w-full rounded-xl bg-[#161826] border border-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#FF007F] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-purple-600 to-[#00E5FF] hover:brightness-110 active:scale-[0.98] text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(255,0,127,0.35)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : showForgotPassword ? (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Send Reset Link</span>
              </>
            ) : isSignUp ? (
              <>
                <span>Create Challenger Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Sign In To Arena</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-5 text-center text-xs text-slate-400">
          {showForgotPassword ? (
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setLocalError(null);
                setResetSuccessMessage(null);
              }}
              className="text-pink-400 hover:text-pink-300 font-bold cursor-pointer"
            >
              ← Back to Sign In
            </button>
          ) : isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setLocalError(null);
                }}
                className="text-pink-400 hover:text-pink-300 font-bold underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to DARE?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setLocalError(null);
                }}
                className="text-[#00E5FF] hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Create an account
              </button>
            </span>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-white/5 text-center text-[10px] text-slate-500 font-mono">
          <span>By continuing, you agree to DARE Terms of Service & Privacy Policy</span>
        </div>

      </div>
    </div>
  );
};
