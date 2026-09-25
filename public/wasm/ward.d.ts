/* tslint:disable */
/* eslint-disable */

/**
 * `ward build`: the check report, plus `files` (`[{path, contents}]`) when it has no errors.
 * `target` is `python` or `typescript`.
 */
export function build(files: string, entry: string, target: string, asyncio: boolean): string;

/**
 * `ward check`: `{ok, errors, warnings, diagnostics, text, functions}`.
 */
export function check(files: string, entry: string): string;

/**
 * `ward fmt` for one file; returns the source unchanged if it doesn't parse.
 */
export function format(src: string): string;

/**
 * The `wardscript` Python runtime package, as `[{path, contents}]`.
 */
export function python_runtime(): string;

/**
 * What `ward run` would execute: the check report, plus the generated Python `files`,
 * the runner `script` and the function's `arity`. The runner reads its arguments from
 * `sys.argv[1:]` (JSON) and its mock answers from the file named by `WARD_MOCK`.
 */
export function run_plan(files: string, entry: string, _function: string): string;

/**
 * `ward trace show` for a trace's JSON lines.
 */
export function trace_show(jsonl: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly build: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly check: (a: number, b: number, c: number, d: number) => [number, number];
    readonly format: (a: number, b: number) => [number, number];
    readonly python_runtime: () => [number, number];
    readonly run_plan: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly trace_show: (a: number, b: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
