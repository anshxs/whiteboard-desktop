"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EditorJS, { type OutputData } from "@editorjs/editorjs";
import { exportToBlob } from "@excalidraw/excalidraw";
import type { AppState } from "@excalidraw/excalidraw/types";
import {
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentPane from "@/components/DocumentPane";
import CanvasPane, { type ExcalidrawScene } from "@/components/CanvasPane";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import SaveQuitDialog from "@/components/SaveQuitDialog";

type ViewMode = "both" | "document" | "canvas";

function contentSignature(document: unknown, canvas: ExcalidrawScene) {
  return JSON.stringify({
    document,
    canvas: {
      elements: canvas.elements,
      files: canvas.files,
      viewBackgroundColor: canvas.appState.viewBackgroundColor ?? "#ffffff",
      gridSize: canvas.appState.gridSize ?? null,
    },
  });
}

export default function ProjectWorkspace({
  project: initialProject,
  onBack,
}: {
  project: WBoardProject;
  onBack: () => void;
}) {
  const [view, setView] = useState<ViewMode>("both");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exitKind, setExitKind] = useState<"back" | "quit">("back");
  const [initialCanvas] = useState<ExcalidrawScene>(
    () => initialProject.canvas as unknown as ExcalidrawScene,
  );
  const editor = useRef<EditorJS | null>(null);
  const editorData = useRef<OutputData>(
    initialProject.document as unknown as OutputData,
  );
  const savingRef = useRef(false);
  const canvasData = useRef<ExcalidrawScene>(
    initialProject.canvas as unknown as ExcalidrawScene,
  );
  const latestProject = useRef(initialProject);
  const savedContent = useRef(
    contentSignature(initialProject.document, initialProject.canvas as unknown as ExcalidrawScene),
  );

  const refreshDirty = useCallback(() => {
    setDirty(contentSignature(editorData.current, canvasData.current) !== savedContent.current);
  }, []);

  const handleDocumentChange = useCallback((data: OutputData) => {
    editorData.current = data;
    refreshDirty();
  }, [refreshDirty]);
  const handleEditor = useCallback((instance: EditorJS | null) => {
    editor.current = instance;
  }, []);
  const handleCanvasChange = useCallback((scene: ExcalidrawScene) => {
    canvasData.current = scene;
    refreshDirty();
  }, [refreshDirty]);
  const save = useCallback(async () => {
    if (!dirty) return true;
    if (!window.desktop || savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      if (typeof editor.current?.save === "function")
        editorData.current = await editor.current.save();
      const next = {
        ...latestProject.current,
        document: editorData.current,
        canvas: canvasData.current,
      } as unknown as WBoardProject;
      const signatureBeingSaved = contentSignature(next.document, next.canvas as unknown as ExcalidrawScene);
      const updatedAt = await window.desktop.saveProject(next);
      next.updatedAt = updatedAt;
      latestProject.current = next;
      savedContent.current = signatureBeingSaved;
      refreshDirty();
      return contentSignature(editorData.current, canvasData.current) === savedContent.current;
    } catch {
      setError(
        "Could not save your project. Check that the file is still accessible.",
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [dirty, refreshDirty]);

  const continueExit = useCallback(async () => {
    if (!(await save())) return;
    setExitDialogOpen(false);
    if (exitKind === "quit") window.desktop?.confirmQuit();
    else onBack();
  }, [exitKind, onBack, save]);

  const requestBack = useCallback(async () => {
    if (savingRef.current) return;
    if (dirty && !(await save())) return;
    onBack();
  }, [dirty, onBack, save]);

  useEffect(() => {
    if (!window.desktop) return;
    return window.desktop.onQuitRequest(() => {
      if (!dirty && !saving) window.desktop?.confirmQuit();
      else {
        setExitKind("quit");
        setExitDialogOpen(true);
      }
    });
  }, [dirty, saving]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      void save();
    }, 5000);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ready, save]);

  async function exportCanvas() {
    const scene = canvasData.current;
    const blob = await exportToBlob({
      elements: scene.elements,
      appState: { ...scene.appState, exportWithDarkMode: false } as AppState,
      files: scene.files,
      mimeType: "image/png",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${initialProject.name}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const showDocument = view !== "canvas";
  const showCanvas = view !== "document";

  return (
    <div className="flex h-full min-h-0 flex-col bg-secondary">
      <SaveQuitDialog
        open={exitDialogOpen}
        saving={saving}
        intent={exitKind}
        onCancel={() => setExitDialogOpen(false)}
        onSaveAndContinue={() => void continueExit()}
        onDiscardAndContinue={() => window.desktop?.confirmQuit()}
      />
      <header className="flex h-[62px] shrink-0 items-center justify-between bg-secondary px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="default"
            size="icon"
            className="size-9 rounded-xl bg-white hover:bg-white text-black"
            onClick={requestBack}
            aria-label="Back to projects"
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {initialProject.name}
            </div>
            {/* <div className="text-[11px] text-slate-500">.wboard project</div> */}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* <div className="hidden text-xs text-gray-400 sm:block">
            <Dot className="mr-1 inline h-6 w-6 text-green-500" />
          </div> */}
          <Button
            variant="outline"
            className="h-9 rounded-xl"
            onClick={() => void exportCanvas()}
            title="Export canvas as PNG"
          >
            Export PNG
          </Button>
          <Button
            className="h-9 rounded-xl bg-black text-white hover:bg-black"
            onClick={() => void save()}
            disabled={saving || !dirty}
          >
            <Save className="mr-1.5 size-4" />
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </Button>
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <div className="flex h-[54px] shrink-0 items-center justify-start bg-secondary px-4 sm:px-6">
        <Tabs defaultValue="Both" className="">
          <TabsList className="h-9 bg-[#e9e9e9]">
            <TabsTrigger onClick={() => setView("both")} value="Both">Both</TabsTrigger>
            <TabsTrigger onClick={() => setView("document")} value="Document">Document</TabsTrigger>
            <TabsTrigger onClick={() => setView("canvas")} value="Canvas">Canvas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div
        className={`grid min-h-0 mx-5 flex-1 ${view === "both" ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        <section
          className={`${showDocument ? "flex" : "hidden"} min-h-0 col-span-1 flex-col bg-secondary`}
          aria-label="Document editor"
        >
          <div className="editor-scroll min-h-0 flex-1 bg-white overflow-visible mx-1 my-4 rounded-2xl px-5 py-5 sm:px-10">
            <DocumentPane
              key={initialProject.path}
              data={initialProject.document}
              onChange={handleDocumentChange}
              onReady={setReady}
              onEditor={handleEditor}
            />
          </div>
        </section>
        <section
          className={`${showCanvas ? "flex" : "hidden"} min-h-0 col-span-2 flex-col bg-secondary`}
          aria-label="Canvas editor"
        >
          <div className="min-h-0 flex-1 overflow-hidden mx-1 my-4 rounded-2xl">
            <CanvasPane
              key={initialProject.path}
              initialData={initialCanvas}
              onChange={handleCanvasChange}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
