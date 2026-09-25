"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { lintGutter, setDiagnostics, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { wardLanguage, wardHighlight } from "../lib/ward-mode";
import { loadWard, filesOf, ENTRY, type Report } from "../lib/ward-wasm";
import { runPython, type RunOutput } from "../lib/pyodide-run";
import { CodeView } from "./CodeView";

export type Example = { id: string; title: string; code: string; fn?: string; args?: string[]; mock?: string };

type Tab = "problems" | "python" | "typescript" | "run";

const toolsOf = (src: string) => [...src.matchAll(/import\s+mcp\s+"([^"]+)"/g)].map((m) => m[1]);

export function Playground({ examples }: { examples: Example[] }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [example, setExample] = useState(examples[0]);
  const [code, setCode] = useState(examples[0].code);
  const [report, setReport] = useState<Report | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("problems");
  const [output, setOutput] = useState<Record<"python" | "typescript", string>>({ python: "", typescript: "" });
  const [fn, setFn] = useState(examples[0].fn ?? "");
  const [args, setArgs] = useState<string[]>(examples[0].args ?? []);
  const [mock, setMock] = useState(examples[0].mock ?? "{}");
  const [running, setRunning] = useState<"idle" | "loading" | "running">("idle");
  const [run, setRun] = useState<(RunOutput & { traceText: string }) | { error: string } | null>(null);

  // The editor, created once; diagnostics come from the latest check report.
  useEffect(() => {
    if (!host.current) return;
    view.current = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: examples[0].code,
        extensions: [
          lineNumbers(), history(), drawSelection(), highlightActiveLine(), indentOnInput(), bracketMatching(),
          closeBrackets(), keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          wardLanguage, wardHighlight, lintGutter(),
          EditorView.updateListener.of((u) => { if (u.docChanged) setCode(u.state.doc.toString()); }),
          EditorView.theme({}, { dark: false }),
        ],
      }),
    });
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check on every edit (debounced), then build both targets.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const ward = await loadWard();
        if (cancelled) return;
        const files = filesOf(code);
        const r = JSON.parse(ward.check(files, ENTRY)) as Report;
        setReport(r);
        const v = view.current;
        if (v && v.state.doc.toString() === code) {
          const doc = v.state.doc;
          // Spans carry byte offsets; lines and (character) columns map onto the editor's positions.
          const pos = (p: { line: number; column: number }) => {
            const line = doc.line(Math.min(Math.max(p.line, 1), doc.lines));
            return Math.min(line.from + p.column - 1, line.to);
          };
          const diags = r.diagnostics.map<CmDiagnostic>((d) => ({
            from: pos(d.span.start),
            to: Math.max(pos(d.span.end), Math.min(pos(d.span.start) + 1, doc.length)),
            severity: d.severity === "error" ? "error" : "warning",
            message: `[${d.code}] ${d.message}${d.help ? `\nhelp: ${d.help}` : ""}`,
          }));
          v.dispatch(setDiagnostics(v.state, diags));
        }
        const out = (target: string) => {
          const b = JSON.parse(ward.build(files, ENTRY, target, false)) as Report;
          return b.files?.map((f) => (b.files!.length > 1 ? `# ${f.path}\n` : "") + f.contents).join("\n") ?? "";
        };
        setOutput(r.ok ? { python: out("python"), typescript: out("typescript") } : { python: "", typescript: "" });
      } catch (e) {
        setLoadError(String(e));
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [code]);

  // Keep the chosen function valid as the program changes.
  const functions = useMemo(() => report?.functions.filter((f) => f.pub) ?? [], [report]);
  useEffect(() => {
    if (!report?.ok || functions.length === 0) return;
    if (!functions.some((f) => f.name === fn)) setFn(functions[0].name);
  }, [functions, fn, report]);
  const params = functions.find((f) => f.name === fn)?.params ?? [];

  function pick(id: string) {
    const ex = examples.find((e) => e.id === id)!;
    setExample(ex);
    setFn(ex.fn ?? "");
    setArgs(ex.args ?? []);
    setMock(ex.mock ?? "{}");
    setRun(null);
    view.current?.dispatch({ changes: { from: 0, to: view.current.state.doc.length, insert: ex.code } });
  }

  async function format() {
    const ward = await loadWard();
    const v = view.current;
    if (!v) return;
    const formatted = ward.format(v.state.doc.toString());
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: formatted } });
  }

  async function execute() {
    setTab("run");
    setRun(null);
    try {
      const ward = await loadWard();
      const plan = JSON.parse(ward.run_plan(filesOf(code), ENTRY, fn)) as Report;
      if (!plan.ok || !plan.script) {
        setRun({ error: plan.error ?? "The program has errors; fix them first (see Problems)." });
        return;
      }
      setRunning("loading");
      const { loadPython } = await import("../lib/pyodide-run");
      await loadPython();
      setRunning("running");
      const res = await runPython({
        runtime: JSON.parse(ward.python_runtime()),
        files: plan.files ?? [],
        script: plan.script,
        args: params.map((_, i) => args[i] ?? "null"),
        mock,
        tools: toolsOf(code),
      });
      setRun({ ...res, traceText: res.trace ? ward.trace_show(res.trace) : "" });
    } catch (e) {
      setRun({ error: `Could not run: ${e}` });
    } finally {
      setRunning("idle");
    }
  }

  const status = loadError
    ? { cls: "bad", text: "Checker failed to load" }
    : !report
      ? { cls: "", text: "Loading checker…" }
      : report.errors > 0
        ? { cls: "bad", text: `${report.errors} error${report.errors === 1 ? "" : "s"}` }
        : report.warnings > 0
          ? { cls: "warn", text: `ok, ${report.warnings} warning${report.warnings === 1 ? "" : "s"}` }
          : { cls: "good", text: "No errors" };

  return (
    <div className="pg">
      <div className="pg-bar">
        <label className="pg-select">
          <span>Example</span>
          <select value={example.id} onChange={(e) => pick(e.target.value)}>
            {examples.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </label>
        <span className={`pg-status ${status.cls}`}>{status.text}</span>
        <div className="pg-actions">
          <button className="btn" onClick={format}>Format</button>
          <button className="btn primary" onClick={execute} disabled={running !== "idle" || !report?.ok || !fn}>
            {running === "loading" ? "Loading Python…" : running === "running" ? "Running…" : "Run ▸"}
          </button>
        </div>
      </div>
      <div className="pg-main">
        <div className="pg-editor" ref={host} />
        <div className="pg-side">
          <div className="pg-tabs" role="tablist">
            {(["problems", "python", "typescript", "run"] as Tab[]).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                {t === "problems" ? `Problems${report && report.diagnostics.length ? ` (${report.diagnostics.length})` : ""}` : t === "python" ? "Python" : t === "typescript" ? "TypeScript" : "Run"}
              </button>
            ))}
          </div>
          <div className="pg-panel">
            {tab === "problems" && (
              loadError ? <pre className="pg-out bad">{loadError}</pre>
                : report?.error ? <pre className="pg-out bad">{report.error}</pre>
                : report && report.diagnostics.length === 0 ? <p className="pg-empty">No problems. Every flow from untrusted data to a sink is checked.</p>
                : <pre className="pg-out">{report?.text}</pre>
            )}
            {(tab === "python" || tab === "typescript") && (
              output[tab] ? <CodeView code={output[tab]} lang={tab} />
                : <p className="pg-empty">Fix the errors to see the generated {tab === "python" ? "Python" : "TypeScript"}.</p>
            )}
            {tab === "run" && (
              <div className="pg-run">
                <label>
                  <span>Function</span>
                  <select value={fn} onChange={(e) => setFn(e.target.value)}>
                    {functions.map((f) => <option key={f.name} value={f.name}>{f.name}({f.params.join(", ")})</option>)}
                  </select>
                </label>
                {params.map((p, i) => (
                  <label key={p + i}>
                    <span>{p} <small>JSON</small></span>
                    <input value={args[i] ?? ""} placeholder='"text", 42, [...]'
                      onChange={(e) => setArgs((a) => { const n = [...a]; n[i] = e.target.value; return n; })} />
                  </label>
                ))}
                <label>
                  <span>Model answers <small>JSON, keyed by ai fn</small></span>
                  <textarea rows={6} value={mock} onChange={(e) => setMock(e.target.value)} spellCheck={false} />
                </label>
                <p className="pg-note">
                  Runs the generated Python in your browser. Models are mocked with the answers above, tools print their calls,
                  and <code>approve(...)</code> asks you.
                </p>
                {run && "error" in run && <pre className="pg-out bad">{run.error}</pre>}
                {run && !("error" in run) && (
                  <>
                    <h4>{run.code === 0 ? "Result" : `Exited with ${run.code}`}</h4>
                    <pre className={`pg-out ${run.code === 0 ? "" : "bad"}`}>{(run.stdout + run.stderr.replace(/^trace: .*\n?/gm, "")).trim() || "(no output)"}</pre>
                    {run.traceText && (<><h4>Audit trace</h4><pre className="pg-out">{run.traceText.trim()}</pre></>)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
