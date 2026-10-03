# Whiteboard

Whiteboard is a desktop workspace for keeping a rich text document and an
Excalidraw canvas together in one project. The desktop shell is Electron and
the UI is a Next.js App Router app.

<img width="1204" height="799" alt="Screenshot 2026-10-03 at 11 52 43" src="https://github.com/user-attachments/assets/07819c23-6d37-47c7-b3d1-3fcb5b37a08c" />

Projects are stored as `.wboard` JSON files in a folder selected by the user.
Each file includes the project name, Editor.js document output, Excalidraw
elements, app state, and embedded drawing files.

## Features

- Editor.js document editing with headings, lists, checklists, quotes, tables,
  code, warnings, and inline formatting tools.
- Excalidraw canvas editing with scene and image export.
- Document, Canvas, and combined workspace views.
- Project creation, search, import, preview, and confirmed deletion.
- Manual and automatic saving to `.wboard` files.
- First-run profile setup and a configurable notes folder.
- Electron IPC bridges for settings, project files, and native file dialogs.

## Requirements

- Node.js 20 or newer.
- npm.
- A supported desktop build host for the platform installer being produced.
- Network access for the first dependency install and Next.js Google Font fetch
  during the production build.

## Install

```bash
npm install
```

## Development

Run the website in a browser:

```bash
npm run dev
```

Run Next.js and the Electron desktop shell together:

```bash
npm run dev:app
```

The app loads `http://localhost:3000` in development. Electron uses a preload
bridge with context isolation enabled; renderer code should access desktop
capabilities through `window.desktop` instead of importing Electron APIs.

## Build the website

```bash
npm run build
npm start
```

Next.js is configured for static export. `npm run build` writes the standalone
site to `out/`; `npm start` serves that directory locally for a production
preview. The static export is also the renderer content included in desktop
packages.

## Build desktop installers

Build an installer for the current host platform:

```bash
npm run build:app
```

Platform-specific commands are available too:

```bash
npm run build:mac
npm run build:win
npm run build:linux
```

The scripts first create the Next.js static export, then run electron-builder.
Installers and archives are written to `release/`. `public/build.png` is used
for the in-app logo, Electron window icon, and packaged app icon. Building for
macOS, Windows, and Linux is most reliable on a native host for that platform;
code signing and notarization require Apple Developer credentials and are not
configured in this repository. The macOS package sets `gatekeeperAssess: false`
to skip electron-builder's build-time signature assessment; this does not
disable macOS Gatekeeper for people opening a downloaded app. A Developer ID
signature and Apple notarization are required to avoid the first-open warning
for distributed macOS builds.

## Project structure

```text
app/                 Next.js route, layout, and global styles
components/           Home screen, workspace panes, dialogs, and UI components
electron.js           Electron main process and filesystem-backed IPC handlers
preload.js            Context-isolated renderer API
lib/                  Shared utilities
public/               Static assets, including build.png
scripts/              Static export preview server
types/                Renderer IPC and editor tool declarations
```

### Project file format

`.wboard` files are UTF-8 JSON with `format: "wboard"` and a format version.
The `document` property stores Editor.js output. The `canvas` property stores
Excalidraw elements, app state, and file data. The Electron main process owns
file reads and writes; renderer components use the typed preload API.

### Useful commands

```bash
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript check
npm run build            # Next.js static production build
npm run build:app        # Static build plus desktop package
```

## Contributing

1. Create a branch from the current main branch.
2. Install dependencies with `npm install`.
3. Run `npm run dev:app` and reproduce or implement the change.
4. Keep Electron-only operations in `electron.js`; expose narrow capabilities
   through `preload.js` and update `types/electron.d.ts` when that API changes.
5. Keep project file changes backward compatible where practical. If the
   `.wboard` structure changes, update its version and document migration
   behavior here.
6. Run `npm run lint` and `npx tsc --noEmit` before opening a pull request.
7. Describe user-visible changes and include screenshots or reproduction steps
   for UI changes.

Do not commit generated output such as `.next/`, `out/`, or `release/`, local
settings, or secrets. Keep changes focused and use the existing TypeScript,
React, and Tailwind conventions in the surrounding files.

## Security notes

Electron runs with `contextIsolation` enabled and `nodeIntegration` disabled.
Add new privileged operations as validated IPC handlers in `electron.js` and
expose only the needed method in `preload.js`. Do not expose `ipcRenderer`, Node
APIs, or arbitrary filesystem access directly to the UI.
