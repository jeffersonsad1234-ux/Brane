const https = require("https");
const WebSocket = require("ws");

const TRUSTED_HOST = "speech.platform.bing.com";
const TOKEN_URL = "https://edge.microsoft.com/translate/auth";

const EDGE_VOICES = [
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Francisca)",  lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Antonio)",   lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Maria)",     lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel)",    lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Aria)",      lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Guy)",       lang: "en-US", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Jenny)",     lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Sara)",      lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (es-ES, Helena)",    lang: "es-ES", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (fr-FR, Denise)",    lang: "fr-FR", gender: "Female", engine: "edge-tts" },
];

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function getToken() {
  return new Promise((resolve, reject) => {
    https.get(TOKEN_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const t = data.trim();
        if (!t) return reject(new Error("Empty token from Edge TTS"));
        resolve(t);
      });
    }).on("error", reject);
  });
}

function buildSSML(text, voiceName, rate, pitch) {
  return `\
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
  <voice name="${escapeXml(voiceName)}">
    <prosody rate="${rate}%" pitch="${pitch}%">
      ${escapeXml(text)}
    </prosody>
  </voice>
</speak>`;
}

const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

function synthesize(text, voiceName, rate = 0, pitch = 0) {
  return new Promise(async (resolve, reject) => {
    let token;
    try {
      token = await getToken();
    } catch (e) {
      return reject(new Error("Edge TTS auth failed: " + e.message));
    }

    const ws = new WebSocket(
      `wss://${TRUSTED_HOST}/consumer/speech/synthesize/readaloud`,
      { headers: { "Authorization": "Bearer " + token } }
    );

    const chunks = [];
    let hasAudio = false;

    ws.on("open", () => {
      const config = JSON.stringify({
        context: {
          synthesis: {
            audio: { metadataoptions: {}, outputformat: OUTPUT_FORMAT },
          },
        },
      });
      ws.send("---\r\nContent-Type: application/json; charset=utf-8\r\nPath: speech.config\r\n\r\n" + config + "\r\n");

      const ssml = buildSSML(text, voiceName, rate, pitch);
      ws.send("---\r\nContent-Type: application/ssml+xml\r\nPath: ssml\r\n\r\n" + ssml + "\r\n");
    });

    ws.on("message", (data) => {
      if (Buffer.isBuffer(data) && data.length > 0) {
        // Find audio data after the text headers (between two binary markers)
        // Edge TTS sends: [header text] + [binary audio] + [turn.end]
        // We look for the audio portion
        const str = data.toString("utf8", 0, Math.min(200, data.length));
        if (str.includes("Path:audio")) {
          // Skip the text header portion, find where binary audio starts
          const headerEnd = data.indexOf("\n\n") + 2;
          if (headerEnd > 2 && headerEnd < data.length) {
            const audioData = data.slice(headerEnd);
            const audioEnd = audioData.indexOf("---\r\n");
            if (audioEnd > 0) {
              chunks.push(audioData.slice(0, audioEnd));
            } else {
              chunks.push(audioData);
            }
            hasAudio = true;
          }
        }
      }
    });

    ws.on("close", () => {
      if (hasAudio && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error("No audio received from Edge TTS"));
      }
    });

    ws.on("error", (err) => {
      reject(new Error("Edge TTS WebSocket error: " + err.message));
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!hasAudio) {
        ws.close();
        reject(new Error("Edge TTS timeout after 15s"));
      }
    }, 15000);
  });
}

module.exports = { synthesize, EDGE_VOICES };
