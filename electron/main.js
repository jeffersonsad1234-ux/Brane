const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

function createWindow() {
  const win = new BrowserWindow({
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
    win.loadURL("http://localhost:3001");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => { app.quit(); });
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
