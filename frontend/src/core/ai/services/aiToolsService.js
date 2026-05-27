const AGENT_API = process.env.REACT_APP_AGENT_API || "http://localhost:3200";

function friendlyError(err) {
  const msg = err?.message || String(err || "");
  if (msg.includes("token") || msg.includes("API key") || msg.includes("unauthorized") || msg.includes("401")) return "Token de API inválido. Configure um token válido do HuggingFace.";
  if (msg.includes("loading") || msg.includes("queued") || msg.includes("Model is loading")) return "Modelo está carregando... Tente novamente em alguns segundos.";
  if (msg.includes("timeout") || msg.includes("timed out")) return "A requisição excedeu o tempo limite. Tente novamente.";
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("Failed to fetch")) return "Erro de conexão com o servidor. Verifique se o agente está rodando.";
  if (msg.includes("429") || msg.includes("rate limit")) return "Muitas requisições. Aguarde um momento e tente novamente.";
  if (msg.includes("503") || msg.includes("busy")) return "Serviço temporariamente indisponível. Tente novamente.";
  return msg.slice(0, 300);
}

async function hfRequest(model, inputs, token, parameters = {}) {
  let retries = 0;
  const maxRetries = 3;
  while (retries < maxRetries) {
    const resp = await fetch(`${AGENT_API}/api/huggingface`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, inputs, token, parameters }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      if (data.error?.includes("loading") && retries < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 5000));
        retries++;
        continue;
      }
      throw new Error(friendlyError(data.error || `HTTP ${resp.status}`));
    }
    return data;
  }
  throw new Error("Modelo não disponível. Tente novamente mais tarde.");
}

export async function generateImage(prompt, token, options = {}) {
  const { model = "black-forest-labs/FLUX.1-dev", width = 1024, height = 1024 } = options;
  const data = await hfRequest(model, prompt, token, { width, height });
  return data.data;
}

export async function generateVideo(prompt, token, options = {}) {
  const { model = "ali-vilab/text-to-video-ms-1.7b", duration = 4 } = options;
  const promptText = prompt + (duration > 4 ? ", slow motion, detailed" : "");
  const data = await hfRequest(model, promptText, token, { num_frames: duration * 8 });
  return data.data;
}

export async function transcribeAudio(audioBase64, token) {
  const resp = await fetch(`${AGENT_API}/api/whisper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64, token }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(friendlyError(data.error || `HTTP ${resp.status}`));
  return data;
}

export async function textToSpeech(text, options = {}) {
  const { voice = "pt-BR-FranciscaNeural", rate = "0%" } = options;
  const resp = await fetch(`${AGENT_API}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, rate }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(friendlyError(data.error || `HTTP ${resp.status}`));
  return data.data;
}

export async function generateAudio(prompt, token, options = {}) {
  const { model = "facebook/musicgen-small", duration = 8 } = options;
  const data = await hfRequest(model, prompt, token, { duration });
  return data.data;
}

export async function analyzeDocument(text, token) {
  const resp = await fetch(`${AGENT_API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Analise o seguinte documento e forneça um resumo estruturado em português brasileiro:\n\n${text.slice(0, 10000)}`,
      history: [],
      ...(token ? { token } : {}),
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(friendlyError(err.error || `HTTP ${resp.status}`));
  }
  let result = "";
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith("data: ")) continue;
      const s = t.slice(6);
      if (s === "[DONE]") break;
      try {
        const chunk = JSON.parse(s);
        if (chunk.content) result += chunk.content;
      } catch {}
    }
  }
  return result || "Nenhum resultado gerado.";
}

export async function translateText(text, targetLang, token) {
  return analyzeDocument(
    `Traduza o seguinte texto para ${targetLang}. Responda apenas com a tradução, sem explicações:\n\n${text}`,
    token
  );
}

export async function generateSubtitles(text, token) {
  return analyzeDocument(
    `Gere legendas em formato SRT para o seguinte texto. Inclua numeração, timestamps (00:00:00,000 --> 00:00:03,000) e o texto:\n\n${text}`,
    token
  );
}
