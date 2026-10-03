export {};

declare global {
  interface Window {
    desktop?: {
      getSettings: () => Promise<{ userName: string; notesPath: string } | null>;
      saveSettings: (settings: { userName: string; notesPath: string }) => Promise<{
        userName: string;
        notesPath: string;
      }>;
      chooseNotesFolder: () => Promise<string | null>;
      listProjects: (folder: string) => Promise<Array<{
        path: string;
        name: string;
        updatedAt: string;
        preview: { document: WBoardProject["document"]; canvas: WBoardProject["canvas"] };
      }>>;
      createProject: (options: { folder: string; name: string }) => Promise<WBoardProject>;
      openProject: (filePath: string) => Promise<WBoardProject>;
      saveProject: (project: WBoardProject) => Promise<string>;
      chooseProjectFile: () => Promise<string | null>;
      deleteProject: (options: { filePath: string; projectName: string }) => Promise<boolean>;
      signalRendererReady: () => void;
      onQuitRequest: (callback: () => void) => () => void;
      confirmQuit: () => void;
    };
  }

  interface WBoardProject {
    format: "wboard";
    version: number;
    name: string;
    path: string;
    createdAt: string;
    updatedAt: string;
    document: { time?: number; blocks: Array<Record<string, unknown>>; version?: string };
    canvas: {
      elements: Array<Record<string, unknown>>;
      appState: Record<string, unknown>;
      files: Record<string, Record<string, unknown>>;
    };
  }
}
