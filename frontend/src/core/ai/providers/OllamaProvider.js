import { BaseProvider, ProviderError } from "./BaseProvider";

function isDev() {
  try {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.");
  } catch { return false; }
}

const DEV_URLS = [
  "",
  "http://127.0.0.1:11434",
  "http://localhost:11434",
  "http://127.0.0.1:8787",
];

const PROD_URLS = [
  "http://127.0.0.1:11434",
  "http://localhost:11434",
  "http://127.0.0.1:8787",
];

function getUrls() {
  return isDev() ? DEV_URLS : PROD_URLS;
}

const DEFAULT_MODEL = "qwen2.5-coder:7b";

function buildPayload(model, messages, stream, options = {}) {
  return {
    model,
    messages,
    stream: false,
    keep_alive: "30m",
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens ?? 4096,
    },
  };
}

export class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "ollama",
      name: "Ollama Local",
      baseUrl: config.baseUrl || localStorage.getItem("ollama_url") || getUrls()[0],
      apiKey: config.apiKey || "",
      models: config.models || [DEFAULT_MODEL],
      defaultModel: config.defaultModel || DEFAULT_MODEL,
      requiresKey: false,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const body = buildPayload(model, messages, false, options);
    const url = `${this.baseUrl}/api/chat`;

    console.log("[Ollama] sendMessage", { url, model });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    console.log("[Ollama] response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.log("[Ollama] error body:", text);
      if (res.status === 404) {
        throw new ProviderError(
          `Modelo "${model}" não encontrado. Execute: ollama pull ${model}`,
          { code: "MODEL_NOT_FOUND", provider: this.id, retryable: false }
        );
      }
      throw new ProviderError(`Ollama error: ${res.status}`, {
        code: "PROVIDER_ERROR", status: res.status, provider: this.id,
      });
    }

    const raw = await res.text();
    console.log("[Ollama] raw body:", raw);

    let data;
    try { data = JSON.parse(raw); } catch {
      throw new ProviderError("Resposta inválida do Ollama (não é JSON)", {
        code: "INVALID_RESPONSE", provider: this.id,
      });
    }
    console.log("[Ollama] parsed data:", data);

    const content = data.message?.content || data.response || "";
    if (!content) {
      throw new ProviderError("Ollama respondeu vazio. Verifique o parser.", {
        code: "EMPTY_RESPONSE", provider: this.id,
      });
    }
    return content;
  }

  async streamMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const body = buildPayload(model, messages, true, options);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      if (res.status === 404) throw new ProviderError(`Modelo "${model}" não encontrado. Execute: ollama pull ${model}`, { code: "MODEL_NOT_FOUND", provider: this.id, retryable: false });
      throw new ProviderError(`Ollama stream error: ${res.status}`, { code: "PROVIDER_ERROR", status: res.status, provider: this.id });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    return {
      async next() {
        if (done) return { done: true, value: undefined };
        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) { done = true; return { done: true, value: undefined }; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              const content = chunk.message?.content || "";
              if (chunk.done) done = true;
              if (content) return { done: false, value: content };
            } catch {}
          }
        }
      },
      [Symbol.asyncIterator]() { return this; },
    };
  }

  async listModels() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return this.models;
      const data = await res.json();
      const models = (data.models || []).map((m) => m.name);
      if (models.length > 0) {
        this.models = models;
        if (!this.defaultModel || !models.includes(this.defaultModel)) {
          this.defaultModel = models[0];
        }
      }
      return models;
    } catch { return this.models; }
  }

  async healthCheck() {
    const urls = getUrls().filter((u) => u !== this.baseUrl);
    urls.unshift(this.baseUrl);

    for (const url of urls) {
      try {
        const res = await fetch(`${url}/api/tags`, {
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) continue;
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { continue; }
        if (!Array.isArray(data?.models) || data.models.length === 0) continue;
        if (this.baseUrl !== url) {
          console.log(`[Ollama] Conectado via ${url}`);
          this.baseUrl = url;
          localStorage.setItem("ollama_url", url);
        }
        return true;
      } catch {}
    }
    return false;
  }
}
