const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { synthesize } = require("./tts-edge");

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    resizable: true,
    title: "Branpy Quiz",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3001");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
  }
}

// ── IPC Handlers ──

ipcMain.handle("tts:edge:speak", async (_event, text, voiceName, rate, pitch) => {
  try {
    const audioBuffer = await synthesize(text, voiceName, rate || 0, pitch || 0);
    return { ok: true, data: audioBuffer.toString("base64") };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("tts:edge:test", async () => {
  try {
    const audioBuffer = await synthesize(
      "Teste de voz.",
      "Microsoft Server Speech Text to Speech Voice (pt-BR, Francisca)",
      0, 0
    );
    return { ok: true, size: audioBuffer.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── App lifecycle ──

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
