import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n/I18nContext";

export default function LanguageSelector({ variant = "default" }) {
  const { lang, setLanguage, languages, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = languages.find((l) => l.code === lang) || languages[0];

  const handleSelect = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  const isNavbar = variant === "navbar";

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
        style={{
          padding: isNavbar ? "6px 10px" : "8px 12px",
          background: open
            ? "rgba(99,102,241,0.15)"
            : isNavbar
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.06)",
          border: open
            ? "1px solid rgba(99,102,241,0.3)"
            : "1px solid rgba(255,255,255,0.08)",
          color: isNavbar ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.85)",
          fontSize: isNavbar ? "12px" : "13px",
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title={t("common.language")}
      >
        <span style={{ fontSize: isNavbar ? "14px" : "16px", lineHeight: 1 }}>🌐</span>
        <span className="hidden sm:inline">{current.nativeName}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            opacity: 0.5,
          }}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(15,15,25,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            minWidth: isNavbar ? "170px" : "200px",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "4px 0" }}>
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className="flex items-center gap-3 w-full text-left transition-all duration-150"
                style={{
                  padding: isNavbar ? "7px 14px" : "9px 16px",
                  background: l.code === lang ? "rgba(99,102,241,0.12)" : "transparent",
                  color: l.code === lang ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                  fontSize: isNavbar ? "12px" : "13px",
                  fontWeight: l.code === lang ? 600 : 400,
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (l.code !== lang) e.target.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = l.code === lang ? "rgba(99,102,241,0.12)" : "transparent";
                }}
              >
                <span style={{ fontSize: "14px", width: "20px", textAlign: "center" }}>
                  {l.code === "pt" ? "🇧🇷" : l.code === "en" ? "🇺🇸" : l.code === "it" ? "🇮🇹" : l.code === "es" ? "🇪🇸" : l.code === "fr" ? "🇫🇷" : l.code === "de" ? "🇩🇪" : l.code === "zh" ? "🇨🇳" : l.code === "ja" ? "🇯🇵" : l.code === "ar" ? "🇸🇦" : l.code === "hi" ? "🇮🇳" : "🌐"}
                </span>
                <span>{l.nativeName}</span>
                <span style={{ fontSize: "10px", opacity: 0.4, marginLeft: "auto" }}>{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
