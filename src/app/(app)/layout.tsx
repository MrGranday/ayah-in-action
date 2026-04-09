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
  const { sidebarOpen, theme } = useUIStore();
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

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <NavSidebar />
        <main
          className="transition-all duration-300 p-4 md:p-8"
          style={{ marginLeft: sidebarOpen ? '240px' : '64px' }}
        >
          {children}
        </main>
        <InstallPrompt />
        <Toaster position="bottom-center" />
      </div>
    </ThemeProvider>
  );
}
