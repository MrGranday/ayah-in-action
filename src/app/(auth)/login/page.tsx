'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';

/* ─── Orbiting Arabic letters (pure CSS animation) ──────────────────── */
const ARABIC_LETTERS = ['ب', 'س', 'م', 'ا', 'ل', 'ل', 'ه'];

function OrbitRing({ radius, duration, letters }: { radius: number; duration: number; letters: string[] }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ animation: `orbitSpin ${duration}s linear infinite` }}
    >
      {letters.map((letter, i) => {
        const angle = (i / letters.length) * 360;
        return (
          <span
            key={i}
            className="absolute font-amiri text-lg font-bold"
            style={{
              top: '50%',
              left: '50%',
              color: 'rgba(10,102,80,0.3)',
              transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`,
              marginTop: '-0.5em',
              marginLeft: '-0.5em',
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const errorParam = searchParams.get('error');
  const detailsParam = searchParams.get('msg');
  const errorMessages: Record<string, string> = {
    invalid_state: 'Security check failed. Please try again.',
    token_failed: 'Could not complete sign-in. Please try again.',
    callback_failed: 'Authentication failed. Please try again.',
    missing_params: 'Invalid callback. Please try again.',
    invalid_nonce: 'Security validation failed. Please try again.',
    init_failed: 'Login initialization failed. Check your connection or configuration.',
  };
  
  let errorMessage = errorParam ? (errorMessages[errorParam] || 'An error occurred. Please try again.') : null;
  if (detailsParam && errorParam) {
    errorMessage = `${errorMessage} (${detailsParam})`;
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Check for existing session cookie
    if (document.cookie.includes('ayah-session')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = () => {
    setLoading(true);
    window.location.href = '/api/auth/login';
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ── Left panel (decorative, hidden on mobile) ───────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'var(--color-emerald)' }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 0, transparent 40px)',
          }}
        />

        {/* Central logo with orbit */}
        <div className="relative w-64 h-64 flex items-center justify-center z-10 mb-12">
          <OrbitRing radius={110} duration={30} letters={ARABIC_LETTERS} />
          <OrbitRing radius={80} duration={20} letters={['ا', 'ل', 'ق', 'ر', 'آ', 'ن']} />

          <div
            className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.3)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="Ayah in Action Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center z-10 text-white max-w-sm">
          <h1 className="font-amiri text-4xl font-bold mb-3">Ayah in Action</h1>
          <p className="font-amiri text-2xl text-white/80 mb-6" dir="rtl">ٱلْقُرْآنُ مَنْهَجُ حَيَاةٍ</p>
          <p className="text-white/70 leading-relaxed">
            Track how the Words of Allah transform your daily walk — from reflection to real-life change.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3 text-left">
            {[
              '📖  Daily ayah with tafsir',
              '✍️  Text & voice journaling',
              '🔥  Streak & growth tracking',
              '🔒  Synced with Quran.com',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Glow blob */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom right, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Right panel (login form) ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md space-y-8 login-panel-animate">

          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="Ayah in Action Logo" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-lg object-cover" />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Ayah in Action</h1>
            <p className="font-amiri text-lg mt-1" style={{ color: 'var(--color-text-muted)' }} dir="rtl">
              ٱلْقُرْآنُ مَنْهَجُ حَيَاةٍ
            </p>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Welcome back.
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Sign in with your Quran.com account to continue your journey.
            </p>
          </div>

          {/* Error alert */}
          {errorMessage && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl text-sm error-shake"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#dc2626',
              }}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login card */}
          <div
            className="rounded-2xl p-8 space-y-6"
            style={{
              background: 'var(--color-parchment)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 40px rgba(0,0,0,0.06), inset 0 0 60px rgba(138,77,15,0.04)',
            }}
          >
            {/* Quran.com logo */}
            <div className="text-center">
              <div
                className="inline-flex items-center gap-3 px-4 py-2 rounded-xl mb-6"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-emerald)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9l4.5 2.25" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Quran.com OAuth
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                We use Quran Foundation&apos;s secure OAuth to authenticate you. Your reflections are stored in your own Quran.com account.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Continue with</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* CTA button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: loading ? 'var(--color-emerald)' : 'linear-gradient(135deg, var(--color-emerald) 0%, #0d8c6c 100%)',
                boxShadow: '0 6px 24px rgba(10,102,80,0.3)',
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              )}
              {loading ? 'Redirecting to Quran.com…' : 'Sign in with Quran.com'}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Your data lives in your Quran.com account — secure and private.
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm transition-colors hover:underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        .login-panel-animate {
          animation: loginReveal 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes loginReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .error-shake {
          animation: shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#051a13]"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
