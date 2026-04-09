'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ScrollText, BarChart3, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

export function NavSidebar() {
  const pathname = usePathname();
  const { user, clearUser } = useAuthStore();
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/history', label: 'My Journal', icon: ScrollText },
    { href: '/impact', label: 'Impact', icon: BarChart3 },
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300',
          'border-r',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border)', minHeight: 64 }}
        >
          {sidebarOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-emerald)' }}
              >
                <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="6">
                  <path d="M50 12 C50 12 18 30 18 52 C18 74 50 90 50 90 C50 90 82 74 82 52 C82 30 50 12 50 12Z" />
                  <circle cx="50" cy="52" r="13" strokeWidth="5" />
                </svg>
              </div>
              <span className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                Ayah in Action
              </span>
            </Link>
          ) : (
            <Link href="/dashboard" className="mx-auto">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-emerald)' }}
              >
                <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="6">
                  <path d="M50 12 C50 12 18 30 18 52 C18 74 50 90 50 90 C50 90 82 74 82 52 C82 30 50 12 50 12Z" />
                  <circle cx="50" cy="52" r="13" strokeWidth="5" />
                </svg>
              </div>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 ml-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-xl transition-all px-3 py-2.5 gap-3',
                  !sidebarOpen && 'justify-center',
                  isActive
                    ? 'font-semibold'
                    : 'font-medium hover:opacity-80',
                )}
                style={{
                  background: isActive ? 'rgba(10,102,80,0.1)' : 'transparent',
                  color: isActive ? 'var(--color-emerald)' : 'var(--color-text-muted)',
                  borderLeft: isActive && sidebarOpen ? '3px solid var(--color-emerald)' : '3px solid transparent',
                }}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        {sidebarOpen && user && (
          <div
            className="px-4 py-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'var(--color-emerald)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {user.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div
          className="p-2 border-t space-y-0.5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-colors hover:opacity-80',
              !sidebarOpen && 'justify-center',
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {sidebarOpen && (
              <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-colors hover:opacity-80',
              !sidebarOpen && 'justify-center',
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>

        {/* Online indicator */}
        <div
          className={cn('px-4 py-3 border-t', !sidebarOpen && 'flex justify-center')}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-emerald)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
            {sidebarOpen && <span>Connected to Quran.com</span>}
          </div>
        </div>
      </aside>
    </>
  );
}
