'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Shield, Check, AlertCircle, Trash2, Cpu, Info, X } from 'lucide-react';
import { saveApiKeys, clearApiKeys, getApiKeyStatus } from '@/app/actions/keys';
import { Button } from './ui/button';
import { toast } from 'sonner';

type PreferredModel = 'claude' | 'gpt4o' | 'gemini' | 'groq' | 'hf';

export function ApiKeySettings() {
  const [keys, setKeys] = useState<{
    claudeKey: string;
    openaiKey: string;
    geminiKey: string;
    groqKey: string;
    hfKey: string;
    preferredModel: PreferredModel;
  }>({
    claudeKey: '',
    openaiKey: '',
    geminiKey: '',
    groqKey: '',
    hfKey: '',
    preferredModel: 'claude',
  });

  const [status, setStatus] = useState({ hasClaude: false, hasOpenAI: false, hasGemini: false, hasGroq: false, hasHf: false });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletingKey, setDeletingKey] = useState<'claude' | 'openai' | 'gemini' | 'groq' | 'hf' | null>(null);

  useEffect(() => {
    getApiKeyStatus().then(res => {
      setStatus({ hasClaude: res.hasClaude, hasOpenAI: res.hasOpenAI, hasGemini: res.hasGemini, hasGroq: res.hasGroq, hasHf: res.hasHf });
      setKeys(prev => ({ ...prev, preferredModel: res.preferredModel as PreferredModel }));
    });
  }, []);

  const refreshStatus = async () => {
    const res = await getApiKeyStatus();
    setStatus({ hasClaude: res.hasClaude, hasOpenAI: res.hasOpenAI, hasGemini: res.hasGemini, hasGroq: res.hasGroq, hasHf: res.hasHf });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveApiKeys(keys);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await refreshStatus();
      toast.success('AI configuration secured to your session.');
    } catch {
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a single key by saving an empty string for it
  const handleDeleteKey = async (provider: 'claude' | 'openai' | 'gemini' | 'groq' | 'hf') => {
    const providerName = provider === 'claude' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Google Gemini' : provider === 'groq' ? 'Groq' : 'Hugging Face';
    setDeletingKey(provider);
    try {
      await saveApiKeys(
        provider === 'claude'   ? { claudeKey: '' }
        : provider === 'openai' ? { openaiKey: '' }
        : provider === 'gemini' ? { geminiKey: '' }
        : provider === 'groq'   ? { groqKey: '' }
        :                         { hfKey: '' }
      );
      setKeys(prev =>
        provider === 'claude'   ? { ...prev, claudeKey: '' }
        : provider === 'openai' ? { ...prev, openaiKey: '' }
        : provider === 'gemini' ? { ...prev, geminiKey: '' }
        : provider === 'groq'   ? { ...prev, groqKey: '' }
        :                         { ...prev, hfKey: '' }
      );
      await refreshStatus();
      toast.warning(`${providerName} key removed from your session.`);
    } catch {
      toast.error(`Failed to remove ${providerName} key.`);
    } finally {
      setDeletingKey(null);
    }
  };

  const handleClearAll = async () => {
    toast.warning('All API keys will be removed from your session.', {
      action: {
        label: 'Confirm',
        onClick: async () => {
          await clearApiKeys();
          setKeys({ claudeKey: '', openaiKey: '', geminiKey: '', groqKey: '', hfKey: '', preferredModel: 'claude' });
          setStatus({ hasClaude: false, hasOpenAI: false, hasGemini: false, hasGroq: false, hasHf: false });
          toast.success('All keys cleared from session.');
        },
      },
      duration: 8000,
    });
  };

  const MODEL_OPTIONS: { id: PreferredModel; label: string; badge?: string }[] = [
    { id: 'claude', label: 'Claude 3.5 Sonnet' },
    { id: 'gpt4o', label: 'GPT-4o' },
    { id: 'gemini', label: 'Gemini 2.0', badge: 'Free' },
    { id: 'groq', label: 'Groq (Llama 3.3)', badge: 'Free' },
    { id: 'hf', label: 'Hugging Face', badge: 'Free' },
  ];

  const API_SECTIONS = [
    {
      id: 'claude' as const,
      name: 'Claude 3.5',
      label: 'Anthropic API Key',
      placeholder: 'sk-ant-...',
      iconColor: 'bg-orange-500/10 text-orange-600',
      isActive: status.hasClaude,
      value: keys.claudeKey,
      onChange: (v: string) => setKeys(prev => ({ ...prev, claudeKey: v })),
    },
    {
      id: 'openai' as const,
      name: 'GPT-4o',
      label: 'OpenAI API Key',
      placeholder: 'sk-...',
      iconColor: 'bg-green-500/10 text-green-600',
      isActive: status.hasOpenAI,
      value: keys.openaiKey,
      onChange: (v: string) => setKeys(prev => ({ ...prev, openaiKey: v })),
    },
    {
      id: 'gemini' as const,
      name: 'Gemini Flash',
      label: 'Google AI API Key',
      placeholder: 'AIza...',
      iconColor: 'bg-blue-500/10 text-blue-500',
      isActive: status.hasGemini,
      value: keys.geminiKey,
      onChange: (v: string) => setKeys(prev => ({ ...prev, geminiKey: v })),
    },
    {
      id: 'groq' as const,
      name: 'Groq Llama',
      label: 'Groq API Key',
      placeholder: 'gsk_...',
      iconColor: 'bg-red-500/10 text-red-500',
      isActive: status.hasGroq,
      value: keys.groqKey,
      onChange: (v: string) => setKeys(prev => ({ ...prev, groqKey: v })),
    },
    {
      id: 'hf' as const,
      name: 'Hugging Face',
      label: 'HF Auth Token',
      placeholder: 'hf_...',
      iconColor: 'bg-yellow-500/10 text-yellow-600',
      isActive: status.hasHf,
      value: keys.hfKey,
      onChange: (v: string) => setKeys(prev => ({ ...prev, hfKey: v })),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-surface-container-low rounded-[2.5rem] p-8 md:p-10 border border-outline-variant/5 parchment-texture editorial-shadow relative overflow-hidden">
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

          {/* Per-provider key inputs */}
          <div className="grid md:grid-cols-3 gap-8">
            {API_SECTIONS.map(section => (
              <div key={section.id} className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between min-h-[2rem]">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${section.iconColor}`}>
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="font-serif text-base text-primary">{section.name}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {section.isActive ? (
                      <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5"
                      >
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Active
                        </span>
                        {/* Per-key delete */}
                        <button
                          onClick={() => handleDeleteKey(section.id)}
                          disabled={deletingKey === section.id}
                          title={`Remove ${section.name} key`}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          {deletingKey === section.id
                            ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                            : <X className="w-3.5 h-3.5" />
                          }
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="inactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <label className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant/40 ml-4">
                    {section.label}
                  </label>
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      placeholder={section.isActive ? '••••••••••••••••' : section.placeholder}
                      value={section.value}
                      onChange={e => section.onChange(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 font-mono text-sm outline-none focus:border-primary/40 transition-all placeholder:italic placeholder:text-on-surface-variant/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Model selector + Save / Clear-All */}
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
                      onClick={() => setKeys(prev => ({ ...prev, preferredModel: opt.id }))}
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
                {/* Clear all button only shown when at least one key exists */}
                {(status.hasClaude || status.hasOpenAI || status.hasGemini || status.hasGroq || status.hasHf) && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 text-[10px] font-bold tracking-widest uppercase"
                    title="Remove all keys"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-6 rounded-2xl silk-gradient text-white font-label text-[10px] tracking-widest uppercase font-bold editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {loading ? 'Securing...' : saved ? '✓ Saved' : 'Apply Configuration'}
                </Button>
              </div>
            </div>
          </div>

          {/* Free-tier advisory notice for Gemini, Groq, and HF */}
          <AnimatePresence>
            {(keys.preferredModel === 'gemini' || keys.preferredModel === 'groq' || keys.preferredModel === 'hf') && (
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
                      {keys.preferredModel === 'gemini' ? 'Gemini' : keys.preferredModel === 'groq' ? 'Groq' : 'Hugging Face'} — Free-Tier Experience Mode
                    </p>
                    <p className="text-[11px] leading-relaxed text-on-surface-variant/70 italic">
                      For the richest Whisper experience — deep tafsir grounding, multi-step Quranic search, and
                      the most accurate verse selection — we recommend using an <strong>OpenAI</strong> or{' '}
                      <strong>Anthropic</strong> key. {keys.preferredModel === 'gemini' ? 'Gemini' : keys.preferredModel === 'groq' ? 'Groq' : 'Hugging Face'} works and is a great free option to explore the
                      Whisper feature, but may produce shallower results.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
        <div>
          <p className="text-xs font-serif text-primary mb-1">Privacy & Architecture</p>
          <p className="text-[10px] leading-relaxed text-on-surface-variant/70 italic">
            Your keys are stored only in your encrypted session cookie. They are never saved to our database,
            never stored in your browser's local storage, and are only used server-side to generate your guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
