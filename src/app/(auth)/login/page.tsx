'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles, Star, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── Orbiting Arabic letters (Refined for Heirloom V2) ──────────────────── */
const ARABIC_LETTERS = ['ب', 'س', 'م', 'ا', 'ل', 'ل', 'ه'];

function OrbitRing({ radius, duration, letters, opacity = 0.3 }: { radius: number; duration: number; letters: string[]; opacity?: number }) {
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
            className="absolute font-amiri text-2xl font-bold"
            style={{
              top: '50%',
              left: '50%',
              color: `rgba(0, 76, 59, ${opacity})`,
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
    init_failed: 'Login initialization failed. Check your connection.',
  };

  let errorMessage = errorParam ? (errorMessages[errorParam] || 'An error occurred. Please try again.') : null;
  if (detailsParam && errorParam) {
    errorMessage = `${errorMessage} (${detailsParam})`;
  }

  useEffect(() => {
    setMounted(true);
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
    <div className="min-h-screen flex bg-background selection:bg-tertiary-fixed/30 overflow-hidden">
      {/* ── Left panel (The Sanctuary) ───────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-surface-container-low parchment-texture border-r border-outline-variant/10">

        {/* Subtle decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/10 rounded-full" />

        {/* Central visual core */}
        <div className="relative w-80 h-80 flex items-center justify-center z-10 mb-16">
          <OrbitRing radius={140} duration={40} letters={ARABIC_LETTERS} opacity={0.15} />
          <OrbitRing radius={100} duration={30} letters={['ا', 'ل', 'ق', 'ر', 'آ', 'ن']} opacity={0.2} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-40 h-40 rounded-full flex items-center justify-center shadow-2xl overflow-hidden glass-morphism border-2 border-white/40 ring-1 ring-primary/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="Ayah in Action Logo" className="w-full h-full object-cover scale-100" />
          </motion.div>

          <div className="absolute -bottom-4 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-primary/10 shadow-sm flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="font-label text-[10px] tracking-widest uppercase text-primary font-bold">Divine Wisdom</span>
          </div>
        </div>

        <div className="text-center z-10 max-w-sm space-y-6">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl text-primary">Ayah in Action</h1>
            <p className="font-amiri text-2xl text-primary/60 italic" dir="rtl">ٱلْقُرْآنُ مَنْهَجُ حَيَاةٍ</p>
          </div>

          <p className="font-body text-on-surface-variant leading-relaxed italic">
            &ldquo;Transform the verses you read into the life you lead. A digital heirloom for your spiritual journey.&rdquo;
          </p>

          <div className="pt-8 space-y-4 text-left border-t border-primary/5">
            {[
              { icon: <BookOpen className="w-3.5 h-3.5" />, text: 'Editorial Daily Reflections' },
              { icon: <Star className="w-3.5 h-3.5" />, text: 'Text & Voice Archive' },
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: 'Private Quran.com Sync' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-xs tracking-wide text-on-surface-variant/70 font-label uppercase">
                <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-12">
          <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/20">Version 2.0 Heirloom</span>
        </div>
      </div>

      {/* ── Right panel (Admission) ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-20 relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 hidden lg:block">
          <div className="font-amiri text-[200px] leading-none select-none">ب</div>
        </div>

        <div className="w-full max-w-md space-y-12 relative z-10">
          {/* Header */}
          <div className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <Link href="/" className="inline-flex items-center gap-2 font-label text-[10px] tracking-widest uppercase text-on-surface-variant/40 hover:text-primary transition-colors mb-8 group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                The Sanctuary Home
              </Link>
            </motion.div>

            <div className="lg:hidden mb-8">
              <img src="/icons/icon-192.png" alt="Logo" className="w-16 h-16 rounded-3xl shadow-xl mb-4" />
            </div>

            <h2 className="font-serif text-5xl text-primary leading-tight">
              Enter the <br /><span className="italic font-light">Archive.</span>
            </h2>
            <p className="font-body text-on-surface-variant text-lg">
              Reconnect with your spiritual collection.
            </p>
          </div>

          {/* Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-5 rounded-2xl bg-red-50/50 border border-red-100 text-red-600 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-[2.5rem] p-10 space-y-8 editorial-shadow border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 silk-gradient" />

            <div className="space-y-2">
              <span className="font-label text-[10px] tracking-widest uppercase text-primary/40 block">Authentication Source</span>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/5 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-serif text-xl text-primary">Quran.com OAuth</span>
              </div>
            </div>

            <p className="text-sm font-body text-on-surface-variant leading-relaxed">
              We leverage the Quran Foundation&apos;s state-of-the-art security. Your entries are private, encrypted, and synced with your global account.
            </p>

            <div className="pt-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-4 h-16 rounded-2xl font-bold tracking-[0.2em] uppercase text-xs transition-all duration-700 silk-gradient text-white editorial-shadow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <img src="https://quran.com/favicon-32x32.png" className="w-5 h-5 brightness-0 invert" alt="" />
                    Continue to Quran.com
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 text-center">
              <p className="font-label text-[9px] tracking-widest uppercase text-on-surface-variant/40">
                Secure Connection &bull; Privacy Guaranteed
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="font-body text-xs text-on-surface-variant/50">
              By continuing, you agree to the preservation of your spiritual reflections.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-container-low"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
