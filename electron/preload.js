const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  tts: {
    edge: {
      getVoices: () => ipcRenderer.invoke("tts:edge:voices"),
      speak: (text, voiceName, rate, pitch) =>
        ipcRenderer.invoke("tts:edge:speak", text, voiceName, rate, pitch),
    },
  },
});
