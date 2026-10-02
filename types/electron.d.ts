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
    };
  }
}
