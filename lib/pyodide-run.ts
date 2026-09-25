// Runs `ward run`'s generated Python in the browser with Pyodide, with mocked model answers,
// stub tools and approvals asked through a browser dialog.

const PYODIDE = "https://cdn.jsdelivr.net/npm/pyodide@0.29.5/";

type Py = {
  runPythonAsync(code: string): Promise<unknown>;
  FS: { mkdirTree(p: string): void; writeFile(p: string, d: string): void };
  globals: { set(k: string, v: unknown): void };
  setStdout(o: { batched: (s: string) => void }): void;
  setStderr(o: { batched: (s: string) => void }): void;
};

let loading: Promise<Py> | null = null;

export function loadPython(): Promise<Py> {
  if (!loading) {
    loading = (async () => {
      const { loadPyodide } = (await import(/* webpackIgnore: true */ (PYODIDE + "pyodide.mjs") as string)) as {
        loadPyodide: (o: { indexURL: string }) => Promise<Py>;
      };
      return loadPyodide({ indexURL: PYODIDE });
    })().catch((e) => { loading = null; throw e; });
  }
  return loading;
}

export type RunInput = {
  runtime: { path: string; contents: string }[];
  files: { path: string; contents: string }[];
  script: string;
  args: string[];
  mock: string;
  tools: string[];
};

export type RunOutput = { code: number; stdout: string; stderr: string; trace: string };

const HARNESS = `
import json, os, sys, runpy
from pathlib import Path

_ward = json.loads(_ward_json)
_ward_modules, _ward_tools, _ward_args = _ward["modules"], _ward["tools"], _ward["args"]

for name in list(sys.modules):
    if name == "wardscript" or name.startswith("wardscript.") or name in _ward_modules:
        del sys.modules[name]
if "/ward" not in sys.path:
    sys.path.insert(0, "/ward")

from wardscript import runtime
import js

class _Tool:
    def __init__(self, source):
        self.source = source
    def __getattr__(self, name):
        def call(*args, **kwargs):
            shown = [json.dumps(a, default=str) for a in args] + [f"{k}={json.dumps(v, default=str)}" for k, v in kwargs.items()]
            print(f"[tool] {self.source}.{name}({', '.join(shown)})")
            return "ok"
        return call
    def call_tool(self, name, arguments):
        return getattr(self, name)(**arguments)

def _approver(request):
    ok = bool(js.confirm(f"approve() at {request.site}\\n\\n{json.dumps(request.value, default=str, indent=2)}\\n\\nApprove this value?"))
    print(f"[approve] {'approved' if ok else 'denied'} at {request.site}")
    return ok

runtime.configure(tools={s: _Tool(s) for s in _ward_tools}, approver=_approver)
os.environ["WARD_MOCK"] = "/ward/__mock__.json"
os.environ["WARD_TRACE_DIR"] = "/ward/traces"
for f in Path("/ward/traces").glob("*.jsonl"):
    f.unlink()
sys.argv = ["__ward_run__.py", *_ward_args]
_ward_code = 0
try:
    runpy.run_path("/ward/__ward_run__.py", run_name="__main__")
except SystemExit as e:
    _ward_code = e.code if isinstance(e.code, int) else (0 if e.code is None else 1)
_ward_trace = "".join(p.read_text() for p in sorted(Path("/ward/traces").glob("*.jsonl")))
(_ward_code, _ward_trace)
`;

export async function runPython(input: RunInput): Promise<RunOutput> {
  const py = await loadPython();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s) => { stdout += s + "\n"; } });
  py.setStderr({ batched: (s) => { stderr += s + "\n"; } });
  py.FS.mkdirTree("/ward/traces");
  const write = (path: string, contents: string) => {
    const full = "/ward/" + path;
    py.FS.mkdirTree(full.slice(0, full.lastIndexOf("/")));
    py.FS.writeFile(full, contents);
  };
  for (const f of input.runtime) write(f.path, f.contents);
  for (const f of input.files) write(f.path, f.contents);
  write("__ward_run__.py", input.script);
  write("__mock__.json", input.mock.trim() || "{}");
  py.globals.set("_ward_json", JSON.stringify({
    modules: input.files.map((f) => f.path.replace(/\.py$/, "").replace(/\//g, ".")),
    tools: input.tools,
    args: input.args,
  }));
  const result = (await py.runPythonAsync(HARNESS)) as { toJs(): [number, string] };
  const [code, trace] = result.toJs();
  return { code, stdout, stderr, trace };
}
