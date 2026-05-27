import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
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
  const [lang, setLangState] = useState(getInitialLang);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLanguage = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  }, []);

  const t = useCallback((key, params) => {
    let value =
      resolveTranslation(translationsData[lang], key) ||
      resolveTranslation(translationsData[FALLBACK_LANG], key);
    if (value == null) return key;
    if (params) {
      value = value.replace(/\{\{(\w+)\}\}/g, (_, p) =>
        params[p] != null ? String(params[p]) : `{{${p}}}`
      );
    }
    return value;
  }, [lang]);

  const value = { lang, setLanguage, t, languages: LANGUAGES };
  return React.createElement(I18nContext.Provider, { value }, children);
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
