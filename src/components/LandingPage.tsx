'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, BookOpen, LineChart, ChevronRight, Share2, Sparkles } from 'lucide-react';

export function LandingPage() {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-emerald" />,
      title: "Daily Reflections",
      description: "Receive a handpicked ayah every day to focus your spiritual energy and intention."
    },
    {
      icon: <Mic className="w-6 h-6 text-emerald" />,
      title: "Voice Journaling",
      description: "Record your moments of clarity and application naturally, whenever inspiration strikes."
    },
    {
      icon: <LineChart className="w-6 h-6 text-emerald" />,
      title: "Track Your Growth",
      description: "Visualize how the Quran transforms your character through streaks and categorical insights."
    }
  ];

  return (
    <div className="min-h-screen bg-bg selection:bg-emerald/20 overflow-x-hidden">
      {/* Background Textures */}
      <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(10,102,80,0.05)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3 group translate-x-0 transition-transform hover:translate-x-1 cursor-default">
          <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center shadow-lg shadow-emerald/20">
            <svg viewBox="0 0 100 100" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="6">
              <path d="M50 10C50 10 25 30 25 50C25 70 50 90 50 90C50 90 75 70 75 50C75 30 50 10 50 10Z" />
              <path d="M50 20L50 80M20 50L80 50" strokeWidth="4" />
              <circle cx="50" cy="50" r="15" strokeWidth="4" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">Ayah in Action</span>
        </div>
        <Link 
          href="/login" 
          className="bg-surface hover:bg-parchment text-text-primary px-6 py-2.5 rounded-full border border-border transition-all hover:shadow-md font-medium text-sm"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald/10 text-emerald px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Transform Your Relationship with the Quran
          </div>
          
          <h1 className="text-5xl md:text-7xl font-amiri font-bold text-text-primary leading-[1.1] md:leading-[1.1]">
            Turn Every Ayah <br />
            <span className="text-emerald italic">Into Action.</span>
          </h1>
          
          <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed italic">
            A spiritual journaling companion designed to help you track how the Words of Allah transform your daily walk from reflection to reality.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/api/auth/login"
              className="bg-emerald hover:bg-emerald-dark text-white px-10 py-4 rounded-xl font-semibold shadow-xl shadow-emerald/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Start Your Journey
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features"
              className="bg-surface hover:bg-parchment text-text-primary px-10 py-4 rounded-xl font-semibold border border-border transition-all flex items-center justify-center"
            >
              How it Works
            </Link>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-24 max-w-5xl mx-auto relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald/10 via-gold/10 to-emerald/10 rounded-[32px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="parchment p-2 md:p-6 relative">
            <div className="border border-border/50 rounded-xl bg-white/40 dark:bg-black/20 overflow-hidden shadow-2xl">
              <div className="p-8 md:p-12 text-center space-y-10">
                <div className="space-y-4">
                   <p className="font-amiri text-4xl md:text-5xl text-emerald leading-relaxed" dir="rtl">
                    إِنَّ مَعَ الْعُسْرِ يُسْرًا
                  </p>
                  <p className="text-xl text-text-muted italic">
                    "Verily, with hardship comes ease."
                  </p>
                  <div className="text-xs font-bold tracking-widest text-gold uppercase">Surah Ash-Sharh - 94:6</div>
                </div>

                <div className="max-w-xl mx-auto p-6 bg-surface/50 rounded-xl border border-dashed border-border text-left">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-sm font-bold text-emerald">My Reflection Today</div>
                    <div className="text-xs text-text-muted italic">Oct 12, 2026</div>
                  </div>
                  <p className="text-text-primary leading-relaxed italic">
                    "Today I felt overwhelmed with my workload, but reading this ayah reminded me that the ease is not just 'after' the hardship, but 'with' it. I focused on small wins and found the ease in focused breathing."
                  </p>
                  <div className="mt-4 flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-emerald/10 text-emerald rounded uppercase font-bold tracking-tighter">Patience</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald/10 text-emerald rounded uppercase font-bold tracking-tighter">Gratitude</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <div key={idx} className="space-y-4 p-4 transition-transform hover:-translate-y-1">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed italic">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl md:text-5xl font-amiri font-bold text-text-primary">
                Witness Your Path <br />
                <span className="text-emerald italic">Unfold.</span>
              </h2>
              <p className="text-lg text-text-muted leading-relaxed italic">
                Our dashboard doesn't just show numbers; it shows your spiritual consistency. From categories of reflection to daily momentum, see exactly how your heart is changing over time.
              </p>
              <ul className="space-y-4">
                {[
                  "Category-based impact tracking",
                  "Visual consistency streaks",
                  "Audio-to-text spiritual logs",
                  "Export your journal to PDF"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-text-primary font-medium italic">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="parchment p-4 rotate-1 shadow-lg">
                <div className="aspect-video bg-white/50 rounded-lg border border-border flex items-center justify-center relative overflow-hidden group">
                  <div className="text-center space-y-4">
                    <div className="flex gap-2 justify-center">
                      {[2, 3, 1, 3, 4, 2, 4, 3, 5, 4, 3].map((h, i) => (
                        <div 
                          key={i} 
                          className="w-4 bg-emerald/20 rounded-t-sm transition-all group-hover:bg-emerald" 
                          style={{ height: `${h * 12}px` }} 
                        />
                      ))}
                    </div>
                    <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Consistency Map</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald/5 -z-10" />
        <div className="container mx-auto px-6 text-center space-y-12">
          <h2 className="text-4xl md:text-6xl font-amiri font-bold text-text-primary">
            Quran Menhaj Hayat. <br />
            <span className="text-text-muted text-2xl md:text-3xl italic">The Quran as a Methodology of Life.</span>
          </h2>
          <div className="flex flex-col items-center gap-6">
            <Link 
              href="/api/auth/login"
              className="bg-emerald hover:bg-emerald-dark text-white px-12 py-5 rounded-2xl font-bold shadow-2xl shadow-emerald/20 transition-all hover:scale-105"
            >
              Connect with Quran.com
            </Link>
            <p className="text-sm text-text-muted italic">Secure. Private. Soulful.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 bg-text-muted rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="6">
                <path d="M50 10C50 10 25 30 25 50C25 70 50 90 50 90C50 90 75 70 75 50C75 30 50 10 50 10Z" />
                <path d="M50 20L50 80M20 50L80 50" strokeWidth="4" />
                <circle cx="50" cy="50" r="15" strokeWidth="4" />
              </svg>
            </div>
            <span className="font-bold text-text-primary">Ayah in Action</span>
          </div>
          <div className="flex gap-8 text-sm text-text-muted font-medium italic">
            <Link href="/" className="hover:text-emerald transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-emerald transition-colors">Terms</Link>
            <a href="https://quran.foundation" target="_blank" rel="noopener noreferrer" className="hover:text-emerald transition-colors">Powered by Quran Foundation</a>
          </div>
          <p className="text-xs text-text-muted/60">
            © {new Date().getFullYear()} Ayah in Action. All rights reserved.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}
