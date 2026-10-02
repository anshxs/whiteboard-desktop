"use client";

import { Excalidraw, WelcomeScreen } from "@excalidraw/excalidraw";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";

export type ExcalidrawScene = {
  elements: ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export default function CanvasPane({
  initialData,
  onChange,
}: {
  initialData: ExcalidrawScene;
  onChange: (scene: ExcalidrawScene) => void;
}) {
  return (
    <Excalidraw
      initialData={initialData}
      onChange={(elements, appState, files) => {
        onChange({
          elements: [...elements],
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            gridSize: appState.gridSize,
            currentItemFontFamily: appState.currentItemFontFamily,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            currentItemFillStyle: appState.currentItemFillStyle,
            currentItemStrokeWidth: appState.currentItemStrokeWidth,
            currentItemRoughness: appState.currentItemRoughness,
            currentItemOpacity: appState.currentItemOpacity,
            currentItemEndArrowhead: appState.currentItemEndArrowhead,
          },
          files,
        });
      }}
      UIOptions={{
        canvasActions: {
          loadScene: true,
          export: { saveFileToDisk: true },
          saveAsImage: true,
          clearCanvas: true,
          changeViewBackgroundColor: true,
          toggleTheme: true,
        },
      }}
    >
      <WelcomeScreen>
        <WelcomeScreen.Hints.ToolbarHint />
        <WelcomeScreen.Hints.MenuHint />
        <WelcomeScreen.Hints.HelpHint />
        <WelcomeScreen.Center>
          <WelcomeScreen.Center.Logo>
            <img src="/logo.png" alt="Excalidraw Logo" className="w-16 h-16 opacity-40" />
            </WelcomeScreen.Center.Logo>
        </WelcomeScreen.Center>
      </WelcomeScreen>
    </Excalidraw>
  );
}
