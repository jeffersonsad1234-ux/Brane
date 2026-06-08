const crypto = require("crypto");
const { randomUUID } = require("crypto");
const WebSocket = require("ws");

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_VERSION = "130";
const WSS_BASE = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud";

const WIN_EPOCH = 11644473600;

const EDGE_VOICES = [
  { name: "pt-BR-FranciscaNeural", display: "Francisca",  lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "pt-BR-AntonioNeural",   display: "Antonio",    lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "pt-BR-ThalitaNeural",   display: "Thalita",    lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "pt-BR-FabioNeural",     display: "Fabio",      lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "pt-BR-MariaNeural",     display: "Maria",      lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "pt-BR-DanielNeural",    display: "Daniel",     lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "en-US-AriaNeural",      display: "Aria",       lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "en-US-GuyNeural",       display: "Guy",        lang: "en-US", gender: "Male",   engine: "edge-tts" },
  { name: "en-US-JennyNeural",     display: "Jenny",      lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "es-ES-HelenaNeural",    display: "Helena",     lang: "es-ES", gender: "Female", engine: "edge-tts" },
  { name: "fr-FR-DeniseNeural",    display: "Denise",     lang: "fr-FR", gender: "Female", engine: "edge-tts" },
];

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function removeIncompatibleChars(str) {
  const chars = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31)) {
      chars.push(" ");
    } else {
      chars.push(str[i]);
    }
  }
  return chars.join("");
}

function dateToString() {
  const d = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} GMT+0000 (Coordinated Universal Time)`;
}

function generateSecMsGec() {
  const now = Math.floor(Date.now() / 1000);
  const ticks = Math.floor((now + WIN_EPOCH) * 10000000);
  const rounded = ticks - (ticks % 300000000);
  return crypto.createHash("sha256").update(`${rounded}${TRUSTED_CLIENT_TOKEN}`).digest("hex").toUpperCase();
}

function generateMuid() {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

function buildSSML(text, voiceName, rate, pitch) {
  const r = rate !== 0 ? `${rate > 0 ? "+" : ""}${rate}%` : "+0%";
  const p = pitch !== 0 ? `${pitch > 0 ? "+" : ""}${pitch}%` : "+0%";
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${escapeXml(voiceName)}"><prosody pitch="${p}" rate="${r}">${escapeXml(text)}</prosody></voice></speak>`;
}

function buildConfigMessage() {
  return `X-Timestamp:${dateToString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`;
}

function buildSsmlMessage(ssml) {
  return `X-RequestId:${randomUUID().replace(/-/g, "")}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${dateToString()}Z\r\nPath:ssml\r\n\r\n${ssml}`;
}

function log(msg) {
  console.log(`[EdgeTTS] ${msg}`);
}

function synthesize(text, voiceName, rate = 0, pitch = 0) {
  return new Promise((resolve, reject) => {
    const cleanText = removeIncompatibleChars(text);
    const connectId = randomUUID().replace(/-/g, "");
    const secMsGec = generateSecMsGec();
    const muid = generateMuid();

    const url = `${WSS_BASE}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectId}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-${CHROMIUM_VERSION}.0.0.0`;

    log(`Conectando WebSocket...`);
    log(`URL: ${url}`);
    log(`Voz: ${voiceName}`);
    log(`Texto: "${cleanText.substring(0, 100)}${cleanText.length > 100 ? "..." : ""}"`);
    log(`MUID: ${muid}`);
    log(`Sec-MS-GEC: ${secMsGec}`);

    const wsHeaders = {
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_VERSION}.0.0.0`,
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      "Cookie": `muid=${muid};`,
    };

    const ws = new WebSocket(url, { headers: wsHeaders });

    const audioChunks = [];
    let hasAudio = false;
    let turnEndReceived = false;
    let timeoutId = null;

    ws.on("open", () => {
      log("WebSocket conectado!");
      const configMsg = buildConfigMessage();
      const ssml = buildSSML(cleanText, voiceName, rate, pitch);
      const ssmlMsg = buildSsmlMessage(ssml);

      log(`SSML: ${ssml}`);
      ws.send(configMsg);
      log("Config enviado.");
      ws.send(ssmlMsg);
      log("SSML enviado.");

      timeoutId = setTimeout(() => {
        if (!hasAudio) {
          log("TIMEOUT: Nenhum audio recebido em 15s");
          ws.close();
          reject(new Error("Edge TTS timeout apos 15s"));
        }
      }, 15000);
    });

    ws.on("message", (data) => {
      if (Buffer.isBuffer(data)) {
        if (data.length < 2) {
          log(`Mensagem binaria muito curta: ${data.length} bytes`);
          return;
        }

        const headerLength = data.readUInt16BE(0);
        log(`Mensagem binaria: total=${data.length} bytes, headerLength=${headerLength}`);

        if (headerLength < 1 || headerLength > data.length - 2) {
          log(`HeaderLength invalido: ${headerLength}`);
          return;
        }

        const headerSection = data.slice(2, 2 + headerLength);
        const headerStr = headerSection.toString("utf8");
        log(`Headers: ${headerStr}`);

        if (headerStr.includes("Path:audio")) {
          // Body comes after headers + \r\n (2 bytes)
          const bodyStart = 2 + headerLength + 2;
          if (bodyStart < data.length) {
            const body = data.slice(bodyStart);
            log(`Audio chunk recebido: ${body.length} bytes`);
            audioChunks.push(body);
            hasAudio = true;
          }
        } else if (headerStr.includes("Path:turn.end")) {
          log("turn.end recebido");
          turnEndReceived = true;
        }
      } else {
        log(`Mensagem de texto recebida: ${data}`);
      }
    });

    ws.on("close", (code, reason) => {
      if (timeoutId) clearTimeout(timeoutId);
      const reasonStr = reason ? reason.toString() : "";
      log(`WebSocket fechado. Code: ${code}, Reason: "${reasonStr}"`);
      log(`hasAudio: ${hasAudio}, chunks: ${audioChunks.length}, turnEnd: ${turnEndReceived}`);

      if (hasAudio && audioChunks.length > 0) {
        const totalBytes = audioChunks.reduce((sum, c) => sum + c.length, 0);
        log(`SUCESSO: ${totalBytes} bytes de audio recebidos`);
        resolve(Buffer.concat(audioChunks));
      } else {
        const errMsg = `Nenhum audio recebido do Edge TTS (wsCode: ${code}, turnEnd: ${turnEndReceived})`;
        log(`ERRO: ${errMsg}`);
        reject(new Error(errMsg));
      }
    });

    ws.on("error", (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      log(`WebSocket ERROR: ${err.message}`);
      reject(new Error(`Edge TTS WebSocket error: ${err.message}`));
    });
  });
}

module.exports = { synthesize, EDGE_VOICES };
