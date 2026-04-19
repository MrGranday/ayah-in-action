'use client';

import { useState } from 'react';
import { useLanguageStore, LanguageOption } from '@/stores/useLanguageStore';
import { Loader2, Globe, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGE_CONFIG } from '@/lib/config/languageMap';

export function LanguageSelector() {
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const currentLang = useLanguageStore(state => state.isoCode);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  const handleSelectLanguage = async (isoCode: string) => {
    if (isoCode === currentLang) return;
    setSwitchingTo(isoCode);

    try {
      const config = LANGUAGE_CONFIG[isoCode];
      if (!config) {
        throw new Error('Language configuration missing');
      }

      const option: LanguageOption = {
        isoCode: isoCode,
        direction: config.direction,
        nativeName: config.nativeName,
        translationResourceId: config.resourceId,
      };

      await setLanguage(option);
      toast.success(`Language updated to ${config.nativeName}`);
      
      // Since the layout uses the session cookie entirely, we force a next/navigation reload
      window.location.reload();

    } catch (err) {
      console.error("Language switch error:", err);
      toast.error('Failed to switch language.');
      setSwitchingTo(null);
    }
  };

  // Convert map to array for rendering
  const languages = Object.entries(LANGUAGE_CONFIG).map(([iso, conf]) => ({
    iso_code: iso,
    native_name: conf.nativeName,
    id: conf.resourceId,
    // Provide a simple readable name for layout fallback if needed
    name: iso.toUpperCase(), 
  }));

  // Optimize mapping context by grouping most common
  const commonCodes = ['en', 'ur', 'ar', 'id', 'fr', 'tr'];
  const common = languages.filter(l => commonCodes.includes(l.iso_code)).sort((a,b) => a.native_name.localeCompare(b.native_name));
  const rest = languages.filter(l => !commonCodes.includes(l.iso_code)).sort((a,b) => a.native_name.localeCompare(b.native_name));
  
  return (
    <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 editorial-shadow">
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <h3 className="font-serif text-2xl text-primary flex items-center gap-3">
             <Globe className="w-6 h-6 opacity-60" /> Interface & Layout Language
          </h3>
          <p className="font-body text-sm text-on-surface-variant max-w-xl">
             Ayah in Action natively supports explicit routing for all verified Quran.com configurations, bypassing public API limits. Your selection orchestrates the Right-To-Left formatting layers of the application dynamically. 
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
        {[...common, ...rest].map((lang) => {
          const isActive = currentLang === lang.iso_code;
          const isSwitching = switchingTo === lang.iso_code;
          
          return (
            <button
              key={lang.iso_code}
              onClick={() => handleSelectLanguage(lang.iso_code)}
              disabled={!!switchingTo}
              className={`
                group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 text-left border
                ${isActive 
                  ? 'bg-primary text-white border-primary editorial-shadow opacity-100' 
                  : 'bg-white text-on-surface hover:bg-primary/5 hover:border-primary/30 border-outline-variant/20 opacity-90'
                }
                ${switchingTo && switchingTo !== lang.iso_code ? 'opacity-40 grayscale pointer-events-none' : ''}
              `}
            >
              <div className="space-y-1">
                 <div className={`font-arabic text-lg leading-tight ${isActive ? 'text-white' : 'text-primary'}`}>
                   {lang.native_name}
                 </div>
              </div>

              {isSwitching && (
                <Loader2 className={`w-4 h-4 animate-spin ${isActive ? 'text-white' : 'text-primary'}`} />
              )}
              {isActive && !isSwitching && (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
