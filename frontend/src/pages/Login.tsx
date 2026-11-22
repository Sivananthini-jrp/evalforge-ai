// evalforge-ai/frontend/src/pages/Login.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/auth';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  UserPlus,
  LogIn,
  CheckCircle2,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const { data } = await api.post(endpoint, { email, password });
      login(data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((v) => !v);
    setError('');
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 sm:p-6">
      {/* local keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBlob {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(24px, -32px, 0) scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .001ms !important;
          }
        }
      `}</style>

      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-3xl"
          style={{ animation: 'floatBlob 14s ease-in-out infinite' }}
        />
        <div
          className="absolute -right-32 top-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/25 blur-3xl"
          style={{ animation: 'floatBlob 18s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-400/20 blur-3xl"
          style={{ animation: 'floatBlob 22s ease-in-out infinite' }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
          }}
        />
      </div>

      {/* auth card */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-2xl shadow-2xl shadow-black/40 sm:p-10"
        style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both' }}
      >
        {/* top glass highlight */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* hover glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative">
          {/* brand */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              EvalForge AI
            </div>
          </div>

          {/* heading */}
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isRegister
                ? 'Start evaluating your LLMs in minutes.'
                : 'Sign in to continue to your workspace.'}
            </p>
          </div>

          {/* error */}
          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 backdrop-blur-md"
              style={{ animation: 'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-300" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-300" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {isRegister ? 'Sign Up' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {isRegister ? 'Already registered?' : 'New here?'}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>

          {/* toggle */}
          <button
            type="button"
            onClick={toggleMode}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            {isRegister ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Sign in instead
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 text-indigo-300" />
                Create an account
              </>
            )}
          </button>

          {/* footer note */}
          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing you agree to EvalForge&apos;s terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}