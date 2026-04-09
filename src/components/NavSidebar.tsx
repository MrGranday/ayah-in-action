'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ScrollText, BarChart3, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

export function NavSidebar() {
  const pathname = usePathname();
  const { user, clearUser } = useAuthStore();
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/history', label: 'History', icon: ScrollText },
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
    setTheme(theme === 'dark' ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-surface border-r border-border transition-all duration-300 z-40',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn('p-4 border-b border-border', !sidebarOpen && 'flex justify-center')}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <svg
              viewBox="0 0 40 40"
              className="w-8 h-8 text-emerald"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 4C20 4 12 12 12 20C12 28 20 36 20 36C20 36 28 28 28 20C28 12 20 4 20 4Z" />
              <path d="M20 12L20 28M12 20L28 20" strokeWidth="1.5" />
            </svg>
            {sidebarOpen && (
              <span className="font-semibold text-lg text-text-primary">Ayah in Action</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-emerald/10 text-emerald border-l-2 border-emerald'
                        : 'text-text-muted hover:bg-surface hover:text-text-primary',
                      !sidebarOpen && 'justify-center'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-colors w-full',
              !sidebarOpen && 'justify-center'
            )}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-colors w-full',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {sidebarOpen && user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center text-emerald font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className={cn('p-4 border-t border-border', !sidebarOpen && 'flex justify-center')}>
          <div
            className={cn(
              'flex items-center gap-2 text-xs text-emerald',
              !sidebarOpen && 'justify-center'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {sidebarOpen && <span>Connected to Quran.com</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
