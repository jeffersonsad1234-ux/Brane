const crypto = require("crypto");
const { randomUUID } = require("crypto");
const WebSocket = require("ws");

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
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

let clockSkewSeconds = 0;

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

function getUnixTimestamp() {
  return Date.now() / 1000 + clockSkewSeconds;
}

function generateSecMsGec() {
  let ticks = getUnixTimestamp();       // seconds, with clock skew
  ticks += WIN_EPOCH;                   // Windows file time epoch (seconds)
  ticks -= ticks % 300;                 // round down to nearest 5 min
  ticks = Math.floor(ticks * 10000000); // convert to 100ns intervals
  return crypto.createHash("sha256").update(`${ticks}${TRUSTED_CLIENT_TOKEN}`).digest("hex").toUpperCase();
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

function parseRfc2616Date(dateStr) {
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? null : parsed / 1000;
}

function buildUrl() {
  const connectId = randomUUID().replace(/-/g, "");
  const secMsGec = generateSecMsGec();
  const version = "130";
  return {
    url: `${WSS_BASE}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectId}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-${version}.0.0.0`,
    connectId,
    secMsGec,
  };
}

function buildHeaders(muid) {
  return {
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": `muid=${muid};`,
  };
}

function doSynthesize(text, voiceName, rate, pitch) {
  return new Promise((resolve, reject) => {
    const cleanText = removeIncompatibleChars(text);
    const muid = generateMuid();
    const { url } = buildUrl();

    log(`Conectando...`);
    log(`URL: ${url}`);
    log(`Voz: ${voiceName}`);
    log(`Clock skew: ${clockSkewSeconds}s`);

    const ws = new WebSocket(url, { headers: buildHeaders(muid) });
    const audioChunks = [];
    let hasAudio = false;
    let turnEndReceived = false;
    let timeoutId = null;
    let httpStatus = null;

    ws.on("open", () => {
      log("WebSocket conectado!");
      const ssml = buildSSML(cleanText, voiceName, rate, pitch);
      ws.send(buildConfigMessage());
      ws.send(buildSsmlMessage(ssml));

      timeoutId = setTimeout(() => {
        if (!hasAudio) {
          log("TIMEOUT: sem audio em 15s");
          ws.close();
          reject(new Error("Edge TTS timeout apos 15s"));
        }
      }, 15000);
    });

    ws.on("message", (data) => {
      if (!Buffer.isBuffer(data)) return;

      const headerLength = data.readUInt16BE(0);
      if (headerLength < 1 || headerLength > data.length - 2) return;

      const headerStr = data.slice(2, 2 + headerLength).toString("utf8");

      if (headerStr.includes("Path:audio")) {
        const bodyStart = 2 + headerLength + 2;
        if (bodyStart < data.length) {
          const body = data.slice(bodyStart);
          audioChunks.push(body);
          hasAudio = true;
        }
      } else if (headerStr.includes("Path:turn.end")) {
        turnEndReceived = true;
      }
    });

    ws.on("close", (code, reason) => {
      if (timeoutId) clearTimeout(timeoutId);
      const reasonStr = reason ? reason.toString() : "";
      log(`Fechado. Code: ${code}, Reason: "${reasonStr}", audio: ${hasAudio}, chunks: ${audioChunks.length}, httpStatus: ${httpStatus}`);

      if (httpStatus === 403) {
        reject(new Error("HTTP 403"));
      } else if (hasAudio && audioChunks.length > 0) {
        const total = audioChunks.reduce((s, c) => s + c.length, 0);
        log(`SUCESSO: ${total} bytes`);
        resolve(Buffer.concat(audioChunks));
      } else {
        reject(new Error(`Nenhum audio (code: ${code}, turnEnd: ${turnEndReceived})`));
      }
    });

    ws.on("error", (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      log(`ERROR: ${err.message}`);
      reject(err);
    });

    // Intercept 403 to extract Date header for clock skew adjustment
    ws.on("unexpected-response", (req, res) => {
      if (timeoutId) clearTimeout(timeoutId);
      httpStatus = res.statusCode;
      log(`Resposta inesperada: ${httpStatus}`);
      log(`Response headers: ${JSON.stringify(res.headers)}`);

      if (httpStatus === 403) {
        const serverDate = res.headers["date"];
        if (serverDate) {
          const serverTs = parseRfc2616Date(serverDate);
          if (serverTs !== null) {
            const clientTs = Date.now() / 1000;
            const skew = serverTs - clientTs;
            clockSkewSeconds += skew;
            log(`Clock skew ajustado em ${skew}s (total: ${clockSkewSeconds}s)`);
          }
        }
      }
      res.resume();
    });
  });
}

function synthesize(text, voiceName, rate = 0, pitch = 0) {
  return doSynthesize(text, voiceName, rate, pitch).catch((err) => {
    if (err.message === "HTTP 403") {
      log("=== RETRY com clock skew ajustado ===");
      return doSynthesize(text, voiceName, rate, pitch);
    }
    throw err;
  });
}

module.exports = { synthesize, EDGE_VOICES };
