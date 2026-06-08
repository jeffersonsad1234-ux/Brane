const { contextBridge, ipcRenderer } = require("electron");

const EDGE_VOICES = [
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Francisca)",  lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Antonio)",   lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Thalita)",   lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Fabio)",     lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Maria)",     lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel)",    lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Aria)",      lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Guy)",       lang: "en-US", gender: "Male",   engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (en-US, Jenny)",     lang: "en-US", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (es-ES, Helena)",    lang: "es-ES", gender: "Female", engine: "edge-tts" },
  { name: "Microsoft Server Speech Text to Speech Voice (fr-FR, Denise)",    lang: "fr-FR", gender: "Female", engine: "edge-tts" },
];

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  tts: {
    edge: {
      voices: EDGE_VOICES,
      speak: (text, voiceName, rate, pitch) =>
        ipcRenderer.invoke("tts:edge:speak", text, voiceName, rate, pitch),
      test: () => ipcRenderer.invoke("tts:edge:test"),
    },
  },
});
