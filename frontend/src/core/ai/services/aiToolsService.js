const AGENT_API = process.env.REACT_APP_AGENT_API || "http://localhost:3200";

async function hfRequest(model, inputs, token, parameters = {}) {
  const resp = await fetch(`${AGENT_API}/api/huggingface`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, inputs, token, parameters }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
  return data;
}

export async function generateImage(prompt, token, options = {}) {
  const { model = "black-forest-labs/FLUX.1-dev", width = 1024, height = 1024 } = options;
  const data = await hfRequest(model, prompt, token, { width, height });
  return data.data;
}

export async function transcribeAudio(audioBase64, token) {
  const resp = await fetch(`${AGENT_API}/api/whisper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64, token }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
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
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
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
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
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
  return result;
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
