'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useEffect, useState } from 'react';
import { NavSidebar } from '@/components/NavSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Toaster } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading } = useAuthStore();
  const { sidebarOpen, theme, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col md:block">
        
        {/* Mobile Top Bar */}
        <div className="md:hidden sticky top-0 z-30 bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/10 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/icons/icon-192.png" alt="Logo" className="w-8 h-8 rounded-full border border-primary/10" />
             <span className="font-serif text-lg text-primary">Ayah in Action</span>
          </div>
          <button onClick={toggleSidebar} className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/10 text-primary hover:bg-primary/5 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>

        <NavSidebar />
        
        <main
          className={`transition-all duration-300 p-4 sm:p-6 md:p-8 flex-1 ${
             mounted && sidebarOpen ? 'md:ms-[288px]' : 'md:ms-[80px]'
          }`}
        >
          {children}
        </main>
        {mounted && <InstallPrompt />}
        <Toaster
          position="bottom-center"
          richColors
          expand
          visibleToasts={4}
          toastOptions={{
            classNames: {
              toast: 'aia-toast',
              success: 'aia-toast-success',
              error: 'aia-toast-error',
              warning: 'aia-toast-warning',
              info: 'aia-toast-info',
              description: 'aia-toast-description',
            },
            duration: 4500,
          }}
        />
      </div>
    </ThemeProvider>
  );
}
