'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const sessionCookie = document.cookie.includes('ayah-session');
    if (sessionCookie) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald/20 to-emerald/5 dark:from-emerald/10 dark:to-transparent p-4">
      <div className="w-full max-w-md">
        <div className="parchment p-8 md:p-12">
          <div className="text-center mb-8">
            <svg
              viewBox="0 0 100 100"
              className="w-24 h-24 mx-auto mb-6 text-emerald"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M50 10C50 10 25 30 25 50C25 70 50 90 50 90C50 90 75 70 75 50C75 30 50 10 50 10Z" />
              <path d="M50 20L50 80M20 50L80 50" strokeWidth="1" />
              <circle cx="50" cy="50" r="15" strokeWidth="1" />
            </svg>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Ayah in Action
            </h1>
            <p className="font-amiri text-xl text-text-muted" dir="rtl">
              القرآن منهج حياة
            </p>
            <p className="text-sm text-text-muted mt-4">
              Track how daily Quran ayahs translate into real-life change
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-emerald hover:bg-emerald/90 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            Login with Quran.com
          </button>

          <p className="text-xs text-text-muted text-center mt-6">
            Your data lives in your Quran.com account — secure and private.
          </p>
        </div>
      </div>
    </div>
  );
}
