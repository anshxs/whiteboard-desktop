/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
/* eslint-enable @typescript-eslint/no-require-imports */

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

async function readSettings() {
  try {
    return JSON.parse(await fs.readFile(settingsPath(), "utf8"));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    )
      return null;
    throw error;
  }
}

ipcMain.handle("settings:get", readSettings);

ipcMain.handle("settings:save", async (_event, settings) => {
  const userName =
    typeof settings?.userName === "string" ? settings.userName.trim() : "";
  const notesPath =
    typeof settings?.notesPath === "string" ? settings.notesPath.trim() : "";
  if (!userName || !notesPath)
    throw new Error("A name and notes folder are required.");

  await fs.mkdir(notesPath, { recursive: true });
  await fs.writeFile(
    settingsPath(),
    JSON.stringify({ userName, notesPath }, null, 2),
    "utf8",
  );
  return { userName, notesPath };
});

ipcMain.handle("notes:choose-folder", async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(window, {
    title: "Choose a folder for your notes",
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:3000");
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
