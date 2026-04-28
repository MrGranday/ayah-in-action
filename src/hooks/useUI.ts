import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';

export function useUI(key: Parameters<typeof t>[0]): string {
  const activeIsoCode = useLanguageStore((state) => state.activeIsoCode);
  return t(key, activeIsoCode);
}
