# Command line

| Command | Does |
|---|---|
| `ward init [DIR]` | start a new project |
| `ward check FILE` | check a program for errors |
| `ward build FILE -o DIR` | compile to Python or TypeScript |
| `ward run FILE FN ARGS...` | build and call a function |
| `ward test FILE [FILTER...]` | run tests |
| `ward fmt FILES...` | format source files |
| `ward lock [mcp.json]` | pin MCP tool schemas in `ward.lock` |
| `ward trace show [RUN]` | show a run's audit trace |
| `ward trace export [RUN]` | export a trace (OTLP or JSONL) |
| `ward lsp` | start the language server |

## `ward check`

```bash
ward check app.ward
ward check app.ward --format json
```

Reports every error and warning in the program and the modules it imports.
`--format json` prints the same diagnostics as JSON, for editors and CI tools.

## `ward build`

```bash
ward build app.ward -o build                      # Python
ward build app.ward -o build --async              # Python, async def
ward build app.ward -o src/gen --target typescript
```

See [Python](../guides/python.md) and [TypeScript](../guides/typescript.md).

## `ward run`

```bash
ward run app.ward route '"an email"' --mock answers.json
ward run app.ward route '"an email"' --model anthropic
ward run app.ward route '"an email"' --model fast=anthropic:<model>
```

Builds the program to a temporary directory and calls `FN` from the entry
module. Arguments are JSON values decoded by the parameters' types, and the
result is printed as JSON. Arguments given on the command line are treated as
vouched for.

| Option | |
|---|---|
| `--mock FILE` | answer `ai fn` calls from a JSON object keyed by function name |
| `--model SPEC` | `anthropic`, `anthropic:<model>`, `openai:<model>`, or `alias=provider:model` |
| `--trace-dir DIR` | where to write the trace (default `.ward/traces`) |
| `--no-trace` | don't write a trace |

`ward run` embeds its own runtime and needs `python3` on the `PATH` (or set
`WARD_PYTHON`). Tools come from the nearest `mcp.json`.

## `ward test`

```bash
ward test app.ward
ward test app.ward billing
ward test app.ward --record --model anthropic
```

See [Testing](../language/testing.md).

## `ward fmt`

```bash
ward fmt src/*.ward
ward fmt --check src/*.ward
```

Formats files in place, keeping comments. `--check` changes nothing and fails if
a file isn't formatted.

## `ward lock`

```bash
ward lock
ward lock path/to/mcp.json
ward lock --check
```

See [Tools](../language/tools.md#lock-their-schemas).

## `ward trace`

```bash
ward trace show [RUN]
ward trace export [RUN] --format otlp
ward trace export [RUN] --format jsonl
ward trace export [RUN] --endpoint http://localhost:4318
```

Reads traces from `--dir`, else `WARD_TRACE_DIR`, else `.ward/traces`. See
[Audit traces](../guides/audit-traces.md).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | success |
| 1 | the program has errors |
| 2 | usage error or internal failure |
| 3 | `ward run`: the program threw or failed at runtime |
| 4 | `ward test`: a test failed |

## Environment variables

| Variable | |
|---|---|
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | provider API keys |
| `WARD_TRACE_DIR` | default trace directory |
| `WARD_PYTHON` | the Python interpreter `ward run` and `ward test` use |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | send every run to this collector |
