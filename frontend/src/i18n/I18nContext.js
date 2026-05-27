import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import translationsData from "./translations";

const I18nContext = createContext(null);

const STORAGE_KEY = "brane_lang";
const FALLBACK_LANG = "en";

const LANGUAGES = [
  { code: "pt", name: "Português", nativeName: "Português" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "it", name: "Italiano", nativeName: "Italiano" },
  { code: "es", name: "Espanol", nativeName: "Español" },
  { code: "fr", name: "Francais", nativeName: "Français" },
  { code: "de", name: "Alemao", nativeName: "Deutsch" },
  { code: "zh", name: "Chines", nativeName: "中文" },
  { code: "ja", name: "Japones", nativeName: "日本語" },
  { code: "ar", name: "Arabe", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {}
  try {
    const browser = navigator.language?.split("-")[0];
    if (browser && LANGUAGES.some((l) => l.code === browser)) return browser;
  } catch {}
  return FALLBACK_LANG;
}

function resolveTranslation(obj, key) {
  const keys = key.split(".");
  let value = obj;
  for (const k of keys) {
    if (value == null || typeof value !== "object") return null;
    value = value[k];
  }
  return typeof value === "string" ? value : null;
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const [revision, setRevision] = useState(0);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLanguage = (code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLang(code);
    setRevision((r) => r + 1);
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  };

  const contextValue = {
    lang,
    revision,
    setLanguage,
    t: (key, params) => {
      void revision; // ensure consumers re-render when language changes
      const currentLang = langRef.current || FALLBACK_LANG;
      const translations = translationsData[currentLang] || translationsData[FALLBACK_LANG];
      let value = resolveTranslation(translations, key);
      if (value == null) {
        value = resolveTranslation(translationsData[FALLBACK_LANG], key);
      }
      if (value == null) return key;
      if (params) {
        value = value.replace(/\{\{(\w+)\}\}/g, (_, p) =>
          params[p] != null ? String(params[p]) : `{{${p}}}`
        );
      }
      return value;
    },
    languages: LANGUAGES,
  };

  return React.createElement(I18nContext.Provider, { value: contextValue }, children);
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: FALLBACK_LANG,
      setLanguage: () => {},
      t: (key) => key,
      languages: LANGUAGES,
    };
  }
  return ctx;
}

export { LANGUAGES, FALLBACK_LANG };
