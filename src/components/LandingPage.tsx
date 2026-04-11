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
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.2,
        dy: -Math.random() * 0.3 - 0.1,
        alpha: Math.random(),
        dAlpha: (Math.random() - 0.5) * 0.003,
      });
    }

    let raf: number;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha = Math.max(0.1, Math.min(0.8, p.alpha + p.dAlpha));
        if (p.alpha <= 0.1 || p.alpha >= 0.8) p.dAlpha *= -1;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) { p.x = width + 10; }
        if (p.x > width + 10) { p.x = -10; }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 76, 59, ${p.alpha * 0.15})`; // Deep Emerald particles
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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
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
        const duration = 2000;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
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
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 1s ease ${delay}ms, transform 1s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Divine Prompting',
      description: 'Every day begins with a selected Ayah that acts as a mirror to your state.',
    },
    {
      icon: <Mic className="w-5 h-5" />,
      title: 'Voice Journals',
      description: 'Capture the whispers of your heart naturally. Transcribed into your archive.',
    },
    {
      icon: <LineChart className="w-5 h-5" />,
      title: 'Visual Lineage',
      description: 'Watch your consistency grow through elegant, editorial-style data views.',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Sacred Privacy',
      description: 'Synced with Quran.com—private, secure, and eternally yours.',
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Virtue Tagging',
      description: 'Organize by Patience, Gratitude, or Sabr to see your spiritual themes.',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Export Legacy',
      description: 'Transform your digital archive into a beautiful PDF keepsake.',
    },
  ];

  return (
    <div className="min-h-screen parchment-texture bg-surface text-on-surface font-body selection:bg-tertiary-fixed selection:text-on-surface">
      <ParticleCanvas />

      {/* ── Navbar (Floating Glass Island) ─────────────────────────── */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-6xl">
        <div className={`glass-morphism h-20 px-8 rounded-[2rem] flex items-center justify-between border border-white/40 shadow-2xl transition-all duration-700 ${
            scrolled ? 'scale-[0.98] shadow-primary/5' : 'scale-100'
        }`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl silk-gradient flex items-center justify-center p-2 shadow-lg group-hover:rotate-12 transition-transform">
                <img src="/icons/icon-192.png" alt="Logo" className="w-full h-full object-cover brightness-0 invert" />
             </div>
             <span className="font-serif italic text-2xl text-primary tracking-tight transition-all hidden sm:block">
               Ayah in Action
             </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-12">
            {[
              { label: 'Journal', href: '#features' },
              { label: 'Reflection', href: '#ritual' },
              { label: 'Community', href: '#philosophy' },
            ].map((item) => (
              <a 
                key={item.label}
                href={item.href} 
                className="font-serif font-light text-lg text-primary/80 hover:text-primary transition-all relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-primary transition-all group-hover:w-full opacity-30" />
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="silk-gradient text-white px-8 py-3 rounded-xl font-label text-[10px] tracking-widest uppercase font-bold hover:scale-105 active:scale-95 transition-all editorial-shadow"
          >
            Start Writing
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 z-10">
        <div className="container mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="max-w-xl">
              <Reveal delay={100}>
                <span className="font-label text-xs tracking-[0.3em] uppercase text-on-surface-variant/70 block mb-6">
                  A Digital Sanctuary
                </span>
              </Reveal>
              
              <Reveal delay={200}>
                <h1 className="font-serif text-6xl md:text-8xl text-primary leading-[1.05] mb-8">
                  Your Spiritual <span className="italic font-light">Legacy</span>, 
                  <br />Written for Eternity.
                </h1>
              </Reveal>

              <Reveal delay={300}>
                <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed mb-12 max-w-lg">
                  More than a journal—a digital heirloom of your soul&apos;s dialogue with the Divine. Capture every insight and build a lasting testament of faith.
                </p>
              </Reveal>

              <Reveal delay={400} className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/login"
                  className="silk-gradient text-white px-10 py-5 rounded-2xl font-bold tracking-wide hover:scale-105 transition-all editorial-shadow flex items-center justify-center gap-2 group"
                >
                  Begin Your Archive
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#philosophy"
                  className="bg-white/50 backdrop-blur-sm text-primary px-10 py-5 rounded-2xl font-semibold tracking-wide border border-outline-variant/20 hover:bg-white transition-all text-center"
                >
                  Our Philosophy
                </a>
              </Reveal>
            </div>

            {/* Visual Column */}
            <Reveal delay={500} className="relative hidden lg:flex justify-center">
              <div className="relative w-full aspect-square max-w-md">
                <div className="absolute inset-0 bg-tertiary-fixed opacity-30 rounded-full blur-[100px] animate-pulse" />
                <div className="relative z-10 w-full h-full border border-primary/5 rounded-full flex items-center justify-center">
                  <div className="w-5/6 h-5/6 border border-primary/10 rounded-full flex items-center justify-center">
                    <div className="w-4/6 h-4/6 silk-gradient rounded-full opacity-5 flex items-center justify-center shadow-inner" />
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/80">
                  <Mic className="w-24 h-24 stroke-[1px] opacity-20" />
                </div>
                <div className="absolute top-10 right-10 text-gold/40 animate-bounce transition-all duration-[3000ms]">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="absolute bottom-20 left-10 text-primary/30">
                  <Sparkles className="w-12 h-12" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Ritual Section ─────────────────────────────────────────── */}
      <section id="ritual" className="bg-surface-container-low py-32 px-8 relative z-10">
        <div className="container mx-auto">
          <Reveal className="text-center mb-24 max-w-2xl mx-auto">
            <span className="font-label text-xs tracking-[0.3em] uppercase text-on-surface-variant block mb-4">The Ritual</span>
            <h2 className="font-serif text-4xl md:text-5xl text-on-surface mb-8">The Daily Anchor</h2>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              A curated path for your morning and evening reflections. We provide the vessel; you provide the soul.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <Sparkles className="text-gold" />, title: 'Divine Prompting', desc: 'Every day begins with a selected Ayah that acts as a mirror to your current state, inviting deep contemplation.' },
              { icon: <Mic className="text-primary" />, title: 'Living Reflection', desc: 'Space to write or speak freely, capturing the whispers of your heart as they align with the sacred text.', stagger: true },
              { icon: <BookOpen className="text-gold" />, title: 'Sacred Storage', desc: 'Each entry is woven into your digital heirloom, timestamped and stored for your future self.' }
            ].map((step, i) => (
              <Reveal key={i} delay={i * 200} className={`bg-white p-12 rounded-3xl editorial-shadow group hover:-translate-y-2 transition-all duration-500 ${step.stagger ? 'md:mt-12' : ''}`}>
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="font-serif text-2xl mb-4 text-primary">{step.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote Block ────────────────────────────────────────────── */}
      <section id="philosophy" className="py-32 px-8 overflow-hidden z-10 relative">
        <div className="container mx-auto">
          <Reveal className="max-w-4xl mx-auto text-center relative">
            <span className="font-serif italic text-8xl text-primary/5 absolute -top-12 -left-8 pointer-events-none select-none">
              &ldquo;
            </span>
            <div className="inline-block relative">
              <div className="absolute inset-x-0 -bottom-2 h-8 bg-tertiary-fixed/30 -rotate-1 skew-x-12" />
              <blockquote className="font-serif italic text-3xl md:text-5xl text-on-surface relative leading-snug">
                &ldquo;And He is with you wherever you are.&rdquo;
              </blockquote>
            </div>
            <cite className="block mt-12 font-label text-xs tracking-[0.4em] text-on-surface-variant uppercase not-italic">
              — Surah Al-Hadid, 4
            </cite>
          </Reveal>
        </div>
      </section>

      {/* ── Archive stats (Journal) ─────────────────────────────────── */}
      <section id="features" className="py-32 px-8 overflow-hidden z-10 relative">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <Reveal className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-surface-container rounded-[2rem] p-4 mt-12 editorial-shadow">
                  <div className="h-48 silk-gradient rounded-2xl opacity-80 flex items-center justify-center p-8">
                    <LineChart className="w-full h-full text-white/50" />
                  </div>
                </div>
                <div className="bg-white rounded-[2rem] p-4 editorial-shadow border border-outline-variant/10">
                  <div className="h-64 bg-tertiary-fixed/40 rounded-2xl flex items-center justify-center p-8">
                    <Star className="w-full h-full text-gold/30 fill-current" />
                  </div>
                </div>
                <div className="bg-surface-container rounded-[2rem] p-4 -mt-16 col-start-2 editorial-shadow">
                  <div className="h-40 bg-primary/90 rounded-2xl flex items-center justify-center p-8">
                     <div className="flex gap-2 items-end">
                      {[4, 7, 5, 8, 6].map((h, i) => (
                        <div key={i} className="w-2 bg-white/30 rounded-full" style={{ height: h * 4 }} />
                      ))}
                     </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="order-1 lg:order-2">
              <Reveal delay={100}>
                <span className="font-label text-xs tracking-[0.3em] uppercase text-on-surface-variant block mb-6">The Archive</span>
                <h2 className="font-serif text-5xl md:text-7xl text-primary leading-tight mb-8">
                  Consistency is the <span className="italic">Thread</span> of Growth.
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-12">
                  Our platform doesn&apos;t just track days; it tracks your spiritual evolution. Watch as your fleeting thoughts transform into a coherent narrative of faith.
                </p>
                <div className="space-y-8">
                  {[
                    { title: 'Visual Lineage', desc: 'Elegant data visualizations that honor your dedication without the clinical feel of standard apps.' },
                    { title: 'Searchable Insights', desc: 'Instantly recall how you felt during Ramadan or after a specific ayah reached you.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="mt-1 text-gold">
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-label text-sm font-bold uppercase tracking-[0.2em] mb-2">{item.title}</h4>
                        <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-32 px-8 relative z-10">
        <div className="container mx-auto">
          <Reveal className="silk-gradient rounded-[3rem] p-16 md:p-32 text-center relative overflow-hidden editorial-shadow">
            {/* Geometric patterns */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <circle cx="10%" cy="10%" r="20" fill="white" />
                 <circle cx="90%" cy="90%" r="30" fill="white" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <h2 className="font-serif text-5xl md:text-7xl text-white mb-10 leading-tight">
                Begin Your Spiritual <span className="italic font-light">Artifact</span> Today.
              </h2>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
                Join a community of seekers dedicated to preserving their most precious resource: their spiritual clarity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/login"
                  className="bg-tertiary-fixed text-on-surface px-12 py-5 rounded-2xl font-bold tracking-wide hover:bg-secondary-fixed transition-all editorial-shadow"
                >
                  Create Your Journal
                </Link>
                <span className="text-white/70 text-xs font-label uppercase tracking-[0.3em]">
                  Start for free
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-surface-container-low/50 py-20 px-8 border-t border-outline-variant/10 relative z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="font-serif italic text-2xl text-primary">
              Ayah in Action
            </div>
            
            <nav className="flex flex-wrap justify-center gap-10">
              {['Privacy Policy', 'Terms of Service', 'Our Philosophy'].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant hover:text-primary transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
            
            <div className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/60">
              © {new Date().getFullYear()} Ayah in Action. A Digital Heirloom.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
