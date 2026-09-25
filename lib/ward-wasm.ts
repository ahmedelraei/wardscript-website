// Loads the Wardscript checker (compiled to WebAssembly from the wardscript repo's
// `ward_wasm` crate; see scripts/build-wasm.mjs) from /wasm.

export type Span = { start: { offset: number; line: number; column: number }; end: { offset: number; line: number; column: number } };
export type Diagnostic = {
  file: string; code: string; severity: "error" | "warning"; message: string; span: Span;
  labels: { primary: boolean; span: Span; message: string | null }[]; help: string | null; notes: string[];
};
export type Report = {
  ok: boolean; error?: string; errors: number; warnings: number; diagnostics: Diagnostic[]; text: string;
  functions: { name: string; pub: boolean; params: string[] }[];
  files?: { path: string; contents: string }[]; script?: string; arity?: number;
};

type Wasm = {
  default: (opts?: { module_or_path?: string }) => Promise<unknown>;
  check(files: string, entry: string): string;
  build(files: string, entry: string, target: string, asyncio: boolean): string;
  run_plan(files: string, entry: string, fn: string): string;
  python_runtime(): string;
  trace_show(jsonl: string): string;
  format(src: string): string;
};

let loading: Promise<Wasm> | null = null;

export function loadWard(): Promise<Wasm> {
  if (!loading) {
    loading = (async () => {
      const mod = (await import(/* webpackIgnore: true */ "/wasm/ward.js" as string)) as Wasm;
      await mod.default({ module_or_path: "/wasm/ward_bg.wasm" });
      return mod;
    })();
  }
  return loading;
}

export const ENTRY = "main.ward";
export const filesOf = (src: string) => JSON.stringify({ [ENTRY]: src });
