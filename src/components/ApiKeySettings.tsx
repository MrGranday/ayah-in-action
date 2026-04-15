'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Shield, Check, AlertCircle, Save, Trash2, Cpu, Info } from 'lucide-react';
import { saveApiKeys, clearApiKeys, getApiKeyStatus } from '@/app/actions/keys';
import { Button } from './ui/button';

type PreferredModel = 'claude' | 'gpt4o' | 'gemini';

export function ApiKeySettings() {
  const [keys, setKeys] = useState<{ 
    claudeKey: string; 
    openaiKey: string;
    geminiKey: string;
    preferredModel: PreferredModel;
  }>({
    claudeKey: '',
    openaiKey: '',
    geminiKey: '',
    preferredModel: 'claude'
  });
  
  const [status, setStatus] = useState({ hasClaude: false, hasOpenAI: false, hasGemini: false });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKeyStatus().then(res => {
      setStatus({ hasClaude: res.hasClaude, hasOpenAI: res.hasOpenAI, hasGemini: res.hasGemini });
      setKeys(prev => ({ ...prev, preferredModel: res.preferredModel as PreferredModel }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveApiKeys(keys);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const res = await getApiKeyStatus();
      setStatus({ hasClaude: res.hasClaude, hasOpenAI: res.hasOpenAI, hasGemini: res.hasGemini });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to remove your API keys? Guidance features will be disabled.')) return;
    await clearApiKeys();
    setKeys({ claudeKey: '', openaiKey: '', geminiKey: '', preferredModel: 'claude' });
    setStatus({ hasClaude: false, hasOpenAI: false, hasGemini: false });
  };

  const MODEL_OPTIONS: { id: PreferredModel; label: string; badge?: string }[] = [
    { id: 'claude', label: 'Claude 3.5 Sonnet' },
    { id: 'gpt4o', label: 'GPT-4o' },
    { id: 'gemini', label: 'Gemini Flash', badge: 'Free Tier' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-surface-container-low rounded-[2.5rem] p-8 md:p-10 border border-outline-variant/5 parchment-texture editorial-shadow relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl silk-gradient flex items-center justify-center text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-primary">Intelligence & Keys</h2>
              <p className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant/60">
                Secure Personal AI Configuration
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Claude Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-base text-primary">Claude 3.5</span>
                </div>
                {status.hasClaude && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant/40 ml-4">
                  Anthropic API Key
                </label>
                <div className="relative group">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    placeholder={status.hasClaude ? "••••••••••••••••" : "sk-ant-..."}
                    value={keys.claudeKey}
                    onChange={(e) => setKeys({ ...keys, claudeKey: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 font-mono text-sm outline-none focus:border-primary/40 transition-all placeholder:italic placeholder:text-on-surface-variant/20"
                  />
                </div>
              </div>
            </div>

            {/* OpenAI Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-base text-primary">GPT-4o</span>
                </div>
                {status.hasOpenAI && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant/40 ml-4">
                  OpenAI API Key
                </label>
                <div className="relative group">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    placeholder={status.hasOpenAI ? "••••••••••••••••" : "sk-..."}
                    value={keys.openaiKey}
                    onChange={(e) => setKeys({ ...keys, openaiKey: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 font-mono text-sm outline-none focus:border-primary/40 transition-all placeholder:italic placeholder:text-on-surface-variant/20"
                  />
                </div>
              </div>
            </div>

            {/* Gemini Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-base text-primary">Gemini Flash</span>
                </div>
                {status.hasGemini && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant/40 ml-4">
                  Google AI API Key
                </label>
                <div className="relative group">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    placeholder={status.hasGemini ? "••••••••••••••••" : "AIza..."}
                    value={keys.geminiKey}
                    onChange={(e) => setKeys({ ...keys, geminiKey: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 font-mono text-sm outline-none focus:border-primary/40 transition-all placeholder:italic placeholder:text-on-surface-variant/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Model selector + actions */}
          <div className="mt-12 pt-8 border-t border-outline-variant/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-3">
                <label className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant/40">
                  Default Guidance Model
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODEL_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setKeys({ ...keys, preferredModel: opt.id })}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border ${
                        keys.preferredModel === opt.id
                          ? 'silk-gradient text-white border-transparent'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-primary/20'
                      }`}
                    >
                      {opt.label}
                      {opt.badge && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                          keys.preferredModel === opt.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary/60'
                        }`}>
                          {opt.badge}
                        </span>
                      )}
                      {keys.preferredModel === opt.id && (
                        <motion.div layoutId="pref" className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {(status.hasClaude || status.hasOpenAI || status.hasGemini) && (
                  <button
                    onClick={handleClear}
                    className="p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                    title="Remove all keys"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-6 rounded-2xl silk-gradient text-white font-label text-[10px] tracking-widest uppercase font-bold editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {loading ? 'Securing...' : saved ? 'Saved Securely' : 'Apply Configuration'}
                </Button>
              </div>
            </div>
          </div>

          {/* Gemini advisory notice */}
          <AnimatePresence>
            {keys.preferredModel === 'gemini' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 items-start bg-blue-500/5 border border-blue-500/15 rounded-2xl px-5 py-4">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-blue-500">
                      Gemini — Free-Tier Experience Mode
                    </p>
                    <p className="text-[11px] leading-relaxed text-on-surface-variant/70 italic">
                      For the richest Whisper experience — deep tafsir grounding, multi-step Quranic search, and
                      the most accurate verse selection — we recommend using an <strong>OpenAI</strong> or
                      <strong> Anthropic</strong> key. Gemini works and is a great free option to experience
                      the Whisper feature, but the tool-calling pipeline may produce shallower results.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
        <div>
          <p className="text-xs font-serif text-primary mb-1">Privacy & Architecture</p>
          <p className="text-[10px] leading-relaxed text-on-surface-variant/70 italic">
            Your keys are stored only in your encrypted session cookie. They are never saved to our database, never stored in your browser's local storage, and are only used server-side to generate your guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
