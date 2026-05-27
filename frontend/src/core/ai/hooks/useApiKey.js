import { useState, useCallback, useEffect } from "react";

const KEY_PREFIX = "branpy_api_key_";

export function useApiKey(service) {
  const storageKey = `${KEY_PREFIX}${service}`;

  const [apiKey, setApiKeyState] = useState(() => {
    try { return localStorage.getItem(storageKey) || ""; } catch { return ""; }
  });

  const setApiKey = useCallback((key) => {
    try {
      if (key) localStorage.setItem(storageKey, key);
      else localStorage.removeItem(storageKey);
    } catch {}
    setApiKeyState(key || "");
  }, [storageKey]);

  const clearApiKey = useCallback(() => setApiKey(""), [setApiKey]);
  const hasKey = !!apiKey;

  return { apiKey, setApiKey, clearApiKey, hasKey };
}

export function useSetupWizard(service) {
  const { apiKey, setApiKey, hasKey } = useApiKey(service);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!hasKey) setShowWizard(true);
  }, [hasKey]);

  const completeSetup = useCallback((key) => {
    setApiKey(key);
    setShowWizard(false);
  }, [setApiKey]);

  const openWizard = useCallback(() => setShowWizard(true), []);
  const closeWizard = useCallback(() => { if (hasKey) setShowWizard(false); }, [hasKey]);

  return { apiKey, hasKey, showWizard, completeSetup, openWizard, closeWizard, setApiKey };
}

const SERVICE_INFO = {
  huggingface: {
    name: "HuggingFace",
    icon: "🤗",
    url: "https://huggingface.co/settings/tokens",
    placeholder: "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    description: "Token de acesso da HuggingFace para gerar imagens, áudio, legendas e mais.",
  },
  openai: {
    name: "OpenAI",
    icon: "⚪",
    url: "https://platform.openai.com/api-keys",
    placeholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    description: "Chave da API OpenAI para gerar conteúdo com modelos GPT.",
  },
  groq: {
    name: "Groq",
    icon: "⚡",
    url: "https://console.groq.com/keys",
    placeholder: "gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    description: "Chave da API Groq para respostas rápidas com modelos Llama, Mixtral e mais.",
  },
};

export function getServiceInfo(service) {
  return SERVICE_INFO[service] || {
    name: service,
    icon: "🔑",
    url: "",
    placeholder: "Sua chave de API",
    description: `Configure sua chave de API para ${service}.`,
  };
}
