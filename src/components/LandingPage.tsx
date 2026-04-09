'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Mic, BookOpen, LineChart, ChevronRight, Sparkles, Star, Shield, Zap, Heart, ArrowRight } from 'lucide-react';

/* ─── Floating particle canvas ─────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; r: number; dx: number; dy: number; alpha: number; dAlpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: -Math.random() * 0.4 - 0.1,
        alpha: Math.random(),
        dAlpha: (Math.random() - 0.5) * 0.005,
      });
    }

    let raf: number;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha = Math.max(0.05, Math.min(1, p.alpha + p.dAlpha));
        if (p.alpha <= 0.05 || p.alpha >= 1) p.dAlpha *= -1;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) { p.x = width + 10; }
        if (p.x > width + 10) { p.x = -10; }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(212,160,23,${p.alpha * 0.4})`;
        ctx!.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }} />;
}

/* ─── Animated counter ──────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Scroll reveal wrapper ─────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Daily Ayah',
      description: 'A handpicked verse every day to anchor your heart and focus your spiritual energy.',
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-[#0a6650]',
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Voice Journaling',
      description: 'Record your moments of clarity naturally. Speak your reflection, transcribed automatically.',
      color: 'from-gold/20 to-amber-500/10',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-[#d4a017]',
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: 'Growth Tracking',
      description: 'Visualize your spiritual consistency. Watch your streaks build and your character evolve.',
      color: 'from-purple-500/20 to-violet-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/10 text-purple-600',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Quran.com Sync',
      description: 'Your reflections are stored in your Quran.com account — private, secure, always yours.',
      color: 'from-blue-500/20 to-sky-500/10',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Category Insights',
      description: 'Tag by Patience, Gratitude, Family and more. Discover which virtues you practice most.',
      color: 'from-rose-500/20 to-pink-500/10',
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/10 text-rose-600',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'PDF Export',
      description: 'Export your entire spiritual journal as a beautiful PDF — a keepsake of your growth.',
      color: 'from-orange-500/20 to-yellow-500/10',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/10 text-orange-600',
    },
  ];

  const testimonials = [
    { text: 'This app changed how I connect with the Quran daily. I can literally see my growth.', name: 'Fatima A.', role: 'Student' },
    { text: 'SubhanAllah. I never thought I could turn my reflections into something this meaningful.', name: 'Ibrahim K.', role: 'Engineer' },
    { text: 'The voice journaling feature is incredible for capturing reflections on the go.', name: 'Aisha M.', role: 'Doctor' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
      <ParticleCanvas />

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(248,241,227,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'var(--color-emerald)' }}
            >
              <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="6">
                <path d="M50 15 C50 15 20 32 20 52 C20 72 50 88 50 88 C50 88 80 72 80 52 C80 32 50 15 50 15Z" />
                <circle cx="50" cy="52" r="12" strokeWidth="5" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Ayah in Action</span>
          </div>
          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            <a href="#features" className="hover:text-[#0a6650] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0a6650] transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-[#0a6650] transition-colors">Impact</a>
          </nav>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
            style={{
              background: 'var(--color-emerald)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(10,102,80,0.25)',
            }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 z-10">
        {/* Radial glow top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(10,102,80,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Pill badge */}
            <div className="landing-hero-animate flex justify-center mb-8" style={{ '--delay': '0ms' } as React.CSSProperties}>
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{
                  background: 'rgba(10,102,80,0.1)',
                  color: 'var(--color-emerald)',
                  border: '1px solid rgba(10,102,80,0.2)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quran Foundation Hackathon 2025
              </span>
            </div>

            {/* Headline */}
            <div className="landing-hero-animate text-center space-y-4 mb-8" style={{ '--delay': '100ms' } as React.CSSProperties}>
              <h1
                className="font-amiri font-bold leading-none tracking-tight"
                style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05 }}
              >
                Turn Every Ayah
                <br />
                <span style={{ color: 'var(--color-emerald)' }}>Into Action.</span>
              </h1>

              {/* Arabic subtitle */}
              <p
                className="font-amiri text-2xl md:text-3xl"
                dir="rtl"
                style={{ color: 'var(--color-gold)' }}
              >
                ٱلْقُرْآنُ مَنْهَجُ حَيَاةٍ
              </p>

              <p
                className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                A spiritual journaling companion that helps you track how the Words of Allah transform your daily walk — from reflection to real change.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="landing-hero-animate flex flex-col sm:flex-row gap-4 justify-center mb-16" style={{ '--delay': '200ms' } as React.CSSProperties}>
              <Link
                href="/api/auth/login"
                className="group flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-emerald) 0%, #0d8c6c 100%)',
                  boxShadow: '0 8px 32px rgba(10,102,80,0.3)',
                }}
              >
                Begin Your Journey
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Explore Features
              </a>
            </div>

            {/* Hero Card Demo */}
            <div className="landing-hero-animate" style={{ '--delay': '300ms' } as React.CSSProperties}>
              <div className="relative max-w-4xl mx-auto">
                {/* Glow */}
                <div
                  className="absolute -inset-6 rounded-[40px] pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(10,102,80,0.12) 0%, transparent 70%)',
                  }}
                />
                {/* Card */}
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: 'var(--color-parchment)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'inset 0 0 80px rgba(138,77,15,0.06), 0 32px 80px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Mock browser bar */}
                  <div
                    className="flex items-center gap-2 px-5 py-3.5"
                    style={{ background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                    <div
                      className="ml-4 flex-1 max-w-xs h-6 rounded-md flex items-center px-3 text-xs"
                      style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-muted)' }}
                    >
                      ayahinaction.app/dashboard
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-12">
                    {/* Ayah display */}
                    <div className="text-center mb-8">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                        style={{ background: 'rgba(212,160,23,0.15)', color: 'var(--color-gold)' }}
                      >
                        <Star className="w-3 h-3" fill="currentColor" /> Surah Ash-Sharh • 94:6
                      </div>
                      <p
                        className="font-amiri text-4xl md:text-5xl leading-relaxed mb-4"
                        dir="rtl"
                        style={{ color: 'var(--color-emerald)' }}
                      >
                        إِنَّ مَعَ الْعُسْرِ يُسْرًا
                      </p>
                      <p
                        className="text-lg italic"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        "Verily, with hardship comes ease."
                      </p>
                    </div>

                    {/* Reflection preview */}
                    <div
                      className="max-w-2xl mx-auto rounded-2xl p-6"
                      style={{
                        background: 'rgba(255,255,255,0.5)',
                        border: '1px dashed var(--color-border)',
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-bold" style={{ color: 'var(--color-emerald)' }}>
                          Today's Reflection
                        </span>
                        <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                          Apr 9, 2026
                        </span>
                      </div>
                      <p className="italic leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                        "Today I felt overwhelmed with my workload, but reading this ayah reminded me that ease is not just after hardship — it's <em>with</em> it. I found calm in small wins."
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Patience', 'Gratitude', 'Work'].map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                            style={{
                              background: 'rgba(10,102,80,0.1)',
                              color: 'var(--color-emerald)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <section id="stats" className="relative z-10 py-16" style={{ background: 'var(--color-emerald)' }}>
        <Reveal className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: 12000, suffix: '+', label: 'Reflections Logged' },
              { value: 47, suffix: ' days', label: 'Avg. Streak Record' },
              { value: 5000, suffix: '+', label: 'Users Journaling' },
              { value: 10, suffix: '', label: 'Spiritual Categories' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold font-amiri mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-white/70 font-medium uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-28">
        <div className="container mx-auto px-6">
          <Reveal className="text-center mb-16">
            <span
              className="text-xs font-bold uppercase tracking-widest mb-4 block"
              style={{ color: 'var(--color-emerald)' }}
            >
              Everything you need
            </span>
            <h2
              className="font-amiri font-bold mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--color-text-primary)' }}
            >
              Built for the sincere Muslim.
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Every feature crafted to help you move from reading to living the Quran.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="group h-full rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, var(--color-surface) 0%, var(--color-parchment) 100%)`,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-emerald)', border: '1px solid var(--color-border)' }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative z-10 py-28"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="container mx-auto px-6">
          <Reveal className="text-center mb-16">
            <span
              className="text-xs font-bold uppercase tracking-widest mb-4 block"
              style={{ color: 'var(--color-gold)' }}
            >
              Simple by design
            </span>
            <h2
              className="font-amiri font-bold"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--color-text-primary)' }}
            >
              Your daily ritual in 3 steps.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Receive Your Ayah',
                desc: 'Every morning a fresh verse greets you — drawn from the eternal wisdom of the Quran.',
                emoji: '📖',
              },
              {
                step: '02',
                title: 'Live & Reflect',
                desc: 'Throughout your day, notice how the verse speaks to your moments. Type or speak your reflection.',
                emoji: '✍️',
              },
              {
                step: '03',
                title: 'Watch Your Growth',
                desc: 'Your streak builds. Your heatmap fills. Your spiritual character becomes visible.',
                emoji: '📈',
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 120} className="relative">
                {/* Connector line */}
                {i < 2 && (
                  <div
                    className="hidden md:block absolute top-8 left-full w-full h-px z-0"
                    style={{
                      background: 'linear-gradient(90deg, var(--color-border) 0%, transparent 100%)',
                      transform: 'translateX(-50%)',
                      width: '50%',
                    }}
                  />
                )}
                <div className="relative z-10 text-center p-6">
                  <div className="text-4xl mb-4">{step.emoji}</div>
                  <div
                    className="text-xs font-black uppercase tracking-widest mb-3"
                    style={{ color: 'var(--color-gold)' }}
                  >
                    Step {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="relative z-10 py-28">
        <div className="container mx-auto px-6">
          <Reveal className="text-center mb-16">
            <h2
              className="font-amiri font-bold" 
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--color-text-primary)' }}
            >
              From the community.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div
                  className="rounded-2xl p-6 h-full"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#d4a017] text-[#d4a017]" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed italic mb-6" style={{ color: 'var(--color-text-primary)' }}>
                    "{t.text}"
                  </p>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section
        className="relative z-10 py-32 overflow-hidden"
        style={{ background: 'var(--color-emerald)' }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <Reveal className="container mx-auto px-6 text-center relative z-10">
          <p className="font-amiri text-4xl text-white/80 mb-4" dir="rtl">
            وَتِلْكَ الْأَمْثَالُ نَضْرِبُهَا لِلنَّاسِ
          </p>
          <h2 className="font-amiri font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            The Quran as a Methodology of Life.
          </h2>
          <p className="text-white/70 text-lg mb-12 max-w-xl mx-auto">
            Join thousands of believers tracking the Quran's impact on their daily lives. Your journey starts with one ayah.
          </p>
          <Link
            href="/api/auth/login"
            className="group inline-flex items-center gap-3 bg-white font-bold px-12 py-5 rounded-2xl text-lg transition-all hover:scale-105 hover:shadow-2xl"
            style={{ color: 'var(--color-emerald)' }}
          >
            Connect with Quran.com
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-6 text-white/50 text-sm">Secure. Private. Soulful.</p>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 py-12"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-emerald)' }}
            >
              <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="6">
                <path d="M50 15 C50 15 20 32 20 52 C20 72 50 88 50 88 C50 88 80 72 80 52 C80 32 50 15 50 15Z" />
                <circle cx="50" cy="52" r="12" strokeWidth="5" />
              </svg>
            </div>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Ayah in Action</span>
          </div>
          <div className="flex gap-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <a href="#" className="hover:text-[#0a6650] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0a6650] transition-colors">Terms</a>
            <a href="https://quran.foundation" target="_blank" rel="noopener noreferrer" className="hover:text-[#0a6650] transition-colors">
              Powered by Quran Foundation
            </a>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
            © {new Date().getFullYear()} Ayah in Action
          </p>
        </div>
      </footer>

      {/* ── Hero animation keyframes ─────────────────────────────────── */}
      <style>{`
        .landing-hero-animate {
          opacity: 0;
          transform: translateY(28px);
          animation: landingReveal 0.8s cubic-bezier(0.22,1,0.36,1) forwards;
          animation-delay: var(--delay, 0ms);
        }
        @keyframes landingReveal {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
