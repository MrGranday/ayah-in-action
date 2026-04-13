'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Shield, Check, AlertCircle, Save, Trash2, Cpu, ChevronRight } from 'lucide-react';
import { saveApiKeys, clearApiKeys, getApiKeyStatus } from '@/app/actions/keys';
import { Button } from './ui/button';

export function ApiKeySettings() {
  const [keys, setKeys] = useState<{ 
    claudeKey: string; 
    openaiKey: string; 
    preferredModel: 'claude' | 'gpt4o' 
  }>({
    claudeKey: '',
    openaiKey: '',
    preferredModel: 'claude'
  });
  
  const [status, setStatus] = useState({ hasClaude: false, hasOpenAI: false });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKeyStatus().then(res => {
      setStatus({ hasClaude: res.hasClaude, hasOpenAI: res.hasOpenAI });
      setKeys(prev => ({ ...prev, preferredModel: res.preferredModel as any }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveApiKeys(keys);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const res = await getApiKeyStatus();
      setStatus({ hasClaude: res.hasClaude, hasOpenAI: res.hasOpenAI });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to remove your API keys? Guidance features will be disabled.')) return;
    await clearApiKeys();
    setKeys({ claudeKey: '', openaiKey: '', preferredModel: 'claude' });
    setStatus({ hasClaude: false, hasOpenAI: false });
  };

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

          <div className="grid md:grid-cols-2 gap-12">
            {/* Claude Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-lg text-primary">Claude 3.5 Sonnet</span>
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
                  <span className="font-serif text-lg text-primary">GPT-4o</span>
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
          </div>

          <div className="mt-12 pt-8 border-t border-outline-variant/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-3">
                <label className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant/40">
                  Default Guidance Model
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setKeys({ ...keys, preferredModel: 'claude' })}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border ${
                      keys.preferredModel === 'claude' 
                        ? 'silk-gradient text-white border-transparent' 
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-primary/20'
                    }`}
                  >
                    Claude 3.5 Sonnet
                    {keys.preferredModel === 'claude' && <motion.div layoutId="pref" className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  <button
                    onClick={() => setKeys({ ...keys, preferredModel: 'gpt4o' })}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border ${
                      keys.preferredModel === 'gpt4o' 
                        ? 'silk-gradient text-white border-transparent' 
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-primary/20'
                    }`}
                  >
                    GPT-4o
                    {keys.preferredModel === 'gpt4o' && <motion.div layoutId="pref" className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {(status.hasClaude || status.hasOpenAI) && (
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
