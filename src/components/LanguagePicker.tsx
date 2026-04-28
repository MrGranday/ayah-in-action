'use client';

import { useLanguageStore } from '@/stores/useLanguageStore';
import { LANGUAGE_CONFIGS } from '@/config/languageConfig';
import { t } from '@/lib/i18n/uiStrings';

export function LanguagePicker() {
  const { activeIsoCode, setLanguage } = useLanguageStore();

  return (
    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-6 md:p-8">
      <h2 className="font-serif text-2xl text-primary mb-2">
        {t('interfaceLanguage', activeIsoCode)}
      </h2>
      <p className="font-body text-sm text-on-surface-variant mb-6">
        {t('interfaceDescription', activeIsoCode)}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.values(LANGUAGE_CONFIGS).map((lang) => (
          <button
            key={lang.isoCode}
            onClick={() => setLanguage(lang.isoCode as any)}
            className={`p-4 rounded-xl text-left border transition-all ${
              activeIsoCode === lang.isoCode
                ? 'bg-primary text-white border-primary editorial-shadow'
                : 'bg-surface border-outline-variant/20 hover:border-primary/50 text-on-surface'
            }`}
          >
            <div className="font-medium text-lg mb-1">{lang.nativeName}</div>
            <div className={`text-xs ${activeIsoCode === lang.isoCode ? 'text-white/70' : 'text-on-surface-variant'}`}>
              {lang.isoCode.toUpperCase()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
