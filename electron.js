/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
/* eslint-enable @typescript-eslint/no-require-imports */

let allowWindowClose = false;
let mainWindow;

app.setName("Whiteboard");
Menu.setApplicationMenu(null);

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

ipcMain.handle("projects:list", async (_event, folder) => {
  const entries = await fs.readdir(folder, { withFileTypes: true });
  const projects = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".wboard"))
      .map(async (entry) => {
        const filePath = path.join(folder, entry.name);
        try {
          const project = JSON.parse(await fs.readFile(filePath, "utf8"));
          return {
            path: filePath,
            name: typeof project.name === "string" ? project.name : entry.name.replace(/\.wboard$/, ""),
            updatedAt: project.updatedAt ?? (await fs.stat(filePath)).mtime.toISOString(),
            preview: {
              document: project.document ?? { blocks: [] },
              canvas: project.canvas ?? { elements: [], appState: {}, files: {} },
            },
          };
        } catch {
          return null;
        }
      }),
  );
  return projects.filter(Boolean).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
});

ipcMain.handle("projects:create", async (_event, { folder, name }) => {
  const projectName = typeof name === "string" ? name.trim() : "";
  if (!projectName) throw new Error("A project name is required.");
  const existingProjects = await fs.readdir(folder, { withFileTypes: true });
  for (const entry of existingProjects) {
    if (!entry.isFile() || !entry.name.endsWith(".wboard")) continue;
    try {
      const existing = JSON.parse(await fs.readFile(path.join(folder, entry.name), "utf8"));
      if (typeof existing.name === "string" && existing.name.trim().toLocaleLowerCase() === projectName.toLocaleLowerCase()) {
        throw new Error("A project with this name already exists.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "A project with this name already exists.") throw error;
      // Ignore malformed project files while checking names.
    }
  }
  const safeName = projectName.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ");
  await fs.mkdir(folder, { recursive: true });
  let filePath = path.join(folder, `${safeName}.wboard`);
  // Avoid overwriting unrelated files in the selected notes directory.
  for (let suffix = 2; await fs.stat(filePath).then(() => true, () => false); suffix += 1) {
    filePath = path.join(folder, `${safeName} (${suffix}).wboard`);
  }
  const project = {
    format: "wboard",
    version: 1,
    name: projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    document: { time: Date.now(), blocks: [], version: "2.31.7" },
    canvas: { elements: [], appState: {}, files: {} },
  };
  await fs.writeFile(filePath, JSON.stringify(project, null, 2), "utf8");
  return { ...project, path: filePath };
});

ipcMain.handle("projects:open", async (_event, filePath) => {
  if (typeof filePath !== "string" || !filePath.endsWith(".wboard")) {
    throw new Error("Choose a .wboard project file.");
  }
  const project = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (project.format !== "wboard" || project.version !== 1) {
    throw new Error("This project format is not supported.");
  }
  return { ...project, path: filePath };
});

ipcMain.handle("projects:save", async (_event, project) => {
  if (typeof project?.path !== "string" || !project.path.endsWith(".wboard")) {
    throw new Error("Invalid project file path.");
  }
  const saved = { ...project, updatedAt: new Date().toISOString() };
  delete saved.path;
  await fs.writeFile(project.path, JSON.stringify(saved, null, 2), "utf8");
  return saved.updatedAt;
});

ipcMain.handle("projects:choose-file", async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(window, {
    title: "Open a Whiteboard project",
    properties: ["openFile"],
    filters: [{ name: "Whiteboard project", extensions: ["wboard"] }],
  });
  return result.canceled ? null : result.filePaths[0] ?? null;
});

ipcMain.handle("projects:delete", async (_event, { filePath, projectName }) => {
  if (typeof filePath !== "string" || !filePath.endsWith(".wboard")) {
    throw new Error("Invalid project file path.");
  }
  const project = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (project.name !== projectName) throw new Error("Project name did not match.");
  await fs.unlink(filePath);
  return true;
});

ipcMain.on("app:quit-confirm", () => {
  allowWindowClose = true;
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  else app.quit();
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Whiteboard",
    icon: path.join(__dirname, app.isPackaged ? "out" : "public", "build.png"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  mainWindow = win;
  win.on("close", (event) => {
    if (allowWindowClose) return;
    event.preventDefault();
    win.webContents.send("app:quit-request");
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "out", "index.html"));
  } else {
    win.loadURL("http://localhost:3000");
  }
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
