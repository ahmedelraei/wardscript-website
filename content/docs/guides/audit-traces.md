# Audit traces

Every run leaves a trace: each model call, tool call, validation, approval and
declassification, in order. It answers the question "why did the agent send
that?".

## Viewing a run

```bash
ward trace show           # the latest run
ward trace show 01J9Z     # a run by id or unique prefix
```

For every tool call, the trace links each argument back to where it came from and
what cleared it:

```text
#4   tool   `gmail.send` at support.wardscript:61:9
         arg 1: "ada@example.com" ← argument `to` from the host, vouched for by the host
         arg 2: "Your refund" ← $.subject of a value approved by a human (#3, support.wardscript:60:24) ← that value: the output of `ai fn draft_reply` (#2), untrusted
```

## Where traces go

`ward run` writes traces to `.ward/traces` (change it with `--trace-dir`, or turn
it off with `--no-trace`). From your application, set
`runtime.configure(trace_dir=...)` or `WARD_TRACE_DIR`. `runtime.last_run()`
returns the last run's id and records either way.

Each run is one file, `<run-id>.jsonl`, with one JSON record per line, written
as events happen. Run ids sort by start time.

## Record kinds

| `kind` | Contains |
|---|---|
| `run_start` | the function called and its arguments |
| `ai_call` | the function, attempt, model alias, prompt, answer, tokens, cost, and why an answer was rejected |
| `tool_call` | the tool, function, call site, arguments and any error |
| `validate` | the rule, call site and whether it passed |
| `approve` | the call site and whether it was approved |
| `declassify` | the call site and reason |
| `budget_exceeded` | the function, resource, limit and amount used |
| `budget_unenforceable` | a `cost` budget that couldn't be counted |
| `run_end` | `ok`, `threw` or `error`, and the run's total tokens, calls and cost |

Values are linked across records by content digests, so the trace doesn't need
to store more than the events themselves.

## OpenTelemetry

Export a run as OpenTelemetry spans:

```bash
ward trace export --format otlp                            # print OTLP/JSON
ward trace export --endpoint http://localhost:4318         # send to a collector
```

The run is the root span, model and tool calls are its children, and checks,
approvals and declassifications are events on the root.

To send every run automatically as it ends, set
`runtime.configure(otlp_endpoint=...)` or `OTEL_EXPORTER_OTLP_ENDPOINT`. If the
collector is unreachable the run carries on and the trace file still has
everything.
