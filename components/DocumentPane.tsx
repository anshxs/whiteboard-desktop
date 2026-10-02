"use client";

import { useEffect, useRef } from "react";
import EditorJS, { type OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Table from "@editorjs/table";
import Checklist from "@editorjs/checklist";
import Warning from "@editorjs/warning";
import Underline from "@editorjs/underline";

type Props = {
  data: WBoardProject["document"];
  onChange: (data: OutputData) => void;
  onReady: (ready: boolean) => void;
  onEditor: (editor: EditorJS | null) => void;
};

export default function DocumentPane({
  data,
  onChange,
  onReady,
  onEditor,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const onEditorRef = useRef(onEditor);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onEditorRef.current = onEditor;
  }, [onEditor]);

  useEffect(() => {
    const holderElement = holder.current;
    if (!holderElement) return;

    let disposed = false;
    let instance: EditorJS | null = null;
    // React Strict Mode runs an extra setup/cleanup pair in development.
    // Deferring construction lets that probe cleanup cancel before creating
    // an Editor.js instance, leaving one editor for the real mount.
    const mountTimer = window.setTimeout(() => {
      if (disposed) return;
      // Editor.js owns everything it adds under this holder. Clearing stale
      // DOM also prevents a previous development remount from showing twice.
      holderElement.replaceChildren();
      instance = new EditorJS({
      holder: holderElement,
      autofocus: false,
      placeholder: "Start writing, or press / to choose a block…",
      data: data as unknown as OutputData,
      inlineToolbar: [
        "link",
        "marker",
        "bold",
        "italic",
        "underline",
        "inlineCode",
      ],
      tools: {
        header: {
          class: Header,
          inlineToolbar: ["link", "marker", "bold", "italic"],
        },
        list: { class: List, inlineToolbar: true },
        checklist: Checklist,
        quote: { class: Quote, inlineToolbar: true },
        warning: Warning,
        code: CodeTool,
        delimiter: Delimiter,
        table: {
          class: Table as unknown as typeof Header,
          inlineToolbar: true,
        },
        marker: Marker,
        underline: Underline,
        inlineCode: InlineCode,
      },
      onChange: async (api) => {
        try {
          onChangeRef.current(await api.saver.save());
        } catch {
          /* keep last valid data */
        }
      },
      });
      editorRef.current = instance;
      onEditorRef.current(instance);
      void instance.isReady
        .then(() => {
          if (!disposed) onReadyRef.current(true);
        })
        .catch((error: unknown) => {
          if (!disposed) onReadyRef.current(false);
          console.error("Editor.js failed to initialize", error);
        });
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(mountTimer);
      onReadyRef.current(false);
      onEditorRef.current(null);
      if (instance) {
        if (editorRef.current === instance) editorRef.current = null;
        if (typeof instance.destroy === "function") instance.destroy();
      }
      holderElement.replaceChildren();
    };
    // The pane is keyed by project path, so its initial document is mounted once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={holder}
      className="editorjs-surface mx-auto min-h-full max-w-[720px]"
    />
  );
}
