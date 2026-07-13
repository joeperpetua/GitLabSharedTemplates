import { useState, useEffect } from 'react';
import en from '../locales/en.json';
import de from '../locales/de.json';

// Type of language codes supported by the application.
// To add a new language:
// 1. Create a new locale file in `src/locales/` (e.g. `es.json`).
// 2. Import it here: `import es from '../locales/es.json';`
// 3. Add the language code to the `locales` registry below.
// 4. Add the language name to the `languageNames` registry below.
export type LanguageCode = string;

export const defaultLanguage: LanguageCode = 'en';

export const locales: Record<LanguageCode, any> = {
  en,
  de,
};

export const languageNames: Record<LanguageCode, string> = {
  en: 'English (US)',
  de: 'Deutsch',
};

/**
 * Resolves a nested key (e.g., 'options.messages.saveSuccess') inside a locale object.
 */
function getNestedTranslation(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Translates a key for a given language, falling back key-by-key to the default language.
 */
export function translate(
  lang: LanguageCode,
  key: string,
  variables?: Record<string, string | number>
): string {
  const translationsForLang = locales[lang];
  let text = translationsForLang ? getNestedTranslation(translationsForLang, key) : undefined;
  
  // Key-by-key fallback to the default language if not found in selected language
  if (text === undefined) {
    const defaultTranslations = locales[defaultLanguage];
    text = getNestedTranslation(defaultTranslations, key) || key;
  }
  
  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      text = text!.replace(new RegExp(`{${k}}`, 'g'), String(v));
    });
  }
  return text;
}

export function useI18n() {
  const [lang, setLang] = useState<LanguageCode>(defaultLanguage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial language from storage
    chrome.storage.sync.get({ language: defaultLanguage }, (items) => {
      if (items.language) {
        setLang(items.language as LanguageCode);
      }
      setLoading(false);
    });

    // Listen for language changes in sync storage
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.language) {
        setLang(changes.language.newValue as LanguageCode);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const t = (key: string, variables?: Record<string, string | number>) => {
    return translate(lang, key, variables);
  };

  return { t, lang, setLang, loading };
}
