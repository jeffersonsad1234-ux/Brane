const { contextBridge, ipcRenderer } = require("electron");

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
