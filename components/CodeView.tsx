"use client";
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { wardHighlight } from "../lib/ward-mode";

/** Read-only, highlighted generated code, in the editor's colors. */
export function CodeView({ code, lang }: { code: string; lang: "python" | "typescript" }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!host.current) return;
    view.current = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: code,
        extensions: [
          lineNumbers(),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          lang === "python" ? python() : javascript({ typescript: true }),
          wardHighlight,
        ],
      }),
    });
    return () => view.current?.destroy();
    // Recreated when the language changes; code updates are dispatched below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== code) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: code } });
  }, [code]);

  return <div className="pg-code" ref={host} />;
}
