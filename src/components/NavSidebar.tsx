'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ScrollText, BarChart3, LogOut, Moon, Sun, Menu, X, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NavSidebar() {
  const pathname = usePathname();
  const { user, clearUser } = useAuthStore();
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { href: '/dashboard', label: 'Sanctuary', icon: Home },
    { href: '/history', label: 'The Archive', icon: ScrollText },
    { href: '/impact', label: 'The Influence', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearUser();
      window.location.href = '/login';
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 z-30 md:hidden backdrop-blur-md"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'border-r bg-surface-container parchment-texture shadow-2xl border-outline-variant/5',
          sidebarOpen ? 'w-72' : 'w-20',
        )}
      >
        {/* Header / Logo Section */}
        <div
          className="flex items-center justify-between p-6 border-b border-outline-variant/5"
          style={{ minHeight: 80 }}
        >
          <Link href="/dashboard" className="flex items-center gap-4 min-w-0 group">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
               <img 
                src="/icons/icon-192.png" 
                alt="Logo" 
                className="w-8 h-8 rounded-full border border-primary/10 relative z-10 grayscale hover:grayscale-0 transition-all duration-500" 
              />
            </div>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-serif text-lg text-primary truncate"
              >
                Ayah in Action
              </motion.span>
            )}
          </Link>
          
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full transition-all hover:bg-primary/5 text-primary/40 hover:text-primary"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative group flex items-center transition-all duration-500 rounded-2xl px-4 py-3.5 gap-4 overflow-hidden',
                  isActive ? 'editorial-shadow scale-[1.02]' : 'hover:bg-primary/5 hover:translate-x-1',
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-bg"
                    className="absolute inset-0 silk-gradient"
                  />
                )}
                
                <item.icon className={cn(
                  'w-5 h-5 shrink-0 relative z-10 transition-colors duration-500',
                  isActive ? 'text-white' : 'text-primary/40 group-hover:text-primary'
                )} />
                
                {sidebarOpen && (
                  <span className={cn(
                    'text-xs font-label tracking-[0.2em] uppercase font-bold relative z-10 transition-colors duration-500',
                    isActive ? 'text-white' : 'text-on-surface-variant/60 group-hover:text-primary'
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        {user && (
          <div className="p-4">
              <div className={cn(
                 "bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-4 transition-all duration-700",
                 !sidebarOpen && "flex justify-center p-2"
              )}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary/5" />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  
                  {sidebarOpen && (
                    <div className="min-w-0">
                      <p className="text-xs font-serif text-primary truncate">
                        {user.name?.split(' ')[0] || 'Seeker'}
                      </p>
                      <p className="text-[9px] font-label tracking-widest uppercase text-on-surface-variant/40 truncate">
                        {user.email || 'Preserving Wisdom'}
                      </p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* System Settings */}
        <div className="p-4 pt-0 space-y-2">
           <div className={cn(
              "flex items-center gap-1",
              !sidebarOpen ? "flex-col" : "justify-between"
           )}>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-2xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all group flex-1"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 mx-auto" /> : <Moon className="w-4 h-4 mx-auto" />}
              </button>
              
              <button
                onClick={handleLogout}
                className="p-3 rounded-2xl text-primary/40 hover:text-red-500 hover:bg-red-50 transition-all group flex-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mx-auto" />
              </button>

              {!sidebarOpen && (
                 <button onClick={toggleSidebar} className="p-3 rounded-2xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
                   <Menu className="w-4 h-4 mx-auto" />
                 </button>
              )}
           </div>
        </div>

        {/* Connectivity Status */}
        <div className="p-6 pt-0 border-t border-primary/5 mt-2">
           <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {sidebarOpen && (
                <span className="font-label text-[9px] tracking-[0.2em] uppercase text-primary/30 font-bold whitespace-nowrap">
                  Quran.com Active
                </span>
              )}
           </div>
        </div>
      </aside>
    </>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
