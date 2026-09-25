# Using Wardscript from Python

`ward build` compiles a program to an ordinary Python module that you import
from your application.

```bash
ward build support.ward -o build          # build/support.py and build/support.pyi
ward build support.ward -o build --async  # async def functions, for asyncio apps
```

Each Wardscript module becomes a `.py` file with a `.pyi` stub, so your editor and
type checker know the signatures. `import support.tickets` becomes
`build/support/tickets.py`. Generated code needs Python 3.10+ and the `wardscript`
runtime package.

## Installing the runtime

The runtime is currently installed from the Wardscript source repository:

```bash
git clone https://github.com/ahmedelraei/wardscript
cd wardscript/crates/ward_runtime/py
pip install maturin && maturin build --release -o dist
pip install dist/*.whl
```

Add a provider with `pip install anthropic` or `pip install openai`.

## Calling your program

```python
from wardscript import runtime, Trusted
from wardscript.providers.anthropic import Anthropic

import build.support as support

runtime.configure(
    model=Anthropic("claude-sonnet-5", prices=(3.0, 15.0)),
    approver=lambda request: input(f"Send {request.value!r}? [y/N] ") == "y",
    trace_dir=".ward/traces",
)

support.handle(incoming_email, Trusted("ada@example.com"))
```

Each call from Python into Wardscript is one **run**, with its own budget and
audit trace.

## Passing trusted values

Anything your application passes in is untrusted by default. A parameter that
reaches a sink (a tool argument, or anything declared `Trusted<T>`) only accepts a
value you vouch for by wrapping it:

```python
support.handle(email, Trusted("ada@example.com"))
support.handle(email, "ada@example.com")   # raises TrustError
```

These parameters are typed `Trusted[T]` in the stubs, so your type checker flags a
missing wrapper too. Other parameters take plain values.

## Configuration

`runtime.configure(...)` only changes the settings it's given; `runtime.reset()`
restores the defaults.

| Setting | |
|---|---|
| `model` | the default model: a provider, `MockModel`, or anything with `complete(request)` |
| `models` | named models for `model {...}` clauses: `{"fast": ..., "smart": ...}` |
| `approver` | called by `approve(x)` with an `ApprovalRequest(value, site, run)`; return `True` to allow. May be `async`. |
| `tools` | tool implementations keyed by server name: MCP servers, dicts of functions, or objects |
| `retries` | extra attempts after an invalid model answer (default 2) |
| `model_retries`, `backoff` | retries and backoff for rate limits and outages (default 2 and 1.0s) |
| `trace_dir` | where to write audit traces (also `WARD_TRACE_DIR`) |
| `otlp_endpoint` | an OpenTelemetry collector to send each run to |
| `check_sinks` | runtime sink checks (default on) |
| `unpriced` | `"warn"` to allow unpriced models under a `cost` budget |
| `on_stream`, `on_partial` | streaming callbacks ([below](#streaming)) |

### Tools

```python
from wardscript import mcp

# MCP servers from a config file
runtime.configure(tools=mcp.load_config("mcp.json"))

# or your own functions
runtime.configure(tools={"gmail": {"send_email": my_send, "list_messages": my_list}})
```

## Errors

A Wardscript `throw` that escapes reaches Python as `wardscript.Thrown`, with the
thrown value in `.value`. Everything else is a subclass of `wardscript.WardError`:

| Error | When |
|---|---|
| `NoModelError` | an `ai fn` is called with no model configured |
| `AiOutputError` | the model never gave a valid answer; `.errors` has each attempt's problem |
| `ModelError` | the provider failed after retries and fallbacks (`RateLimited`, `ModelUnavailable` are subclasses) |
| `BudgetExceeded` | a budget ran out; `.function`, `.resource`, `.limit`, `.used` |
| `BudgetUnenforceable` | a `cost` budget with a model whose cost is unknown |
| `ApprovalDenied` | `approve` was refused, or no approver is configured |
| `TrustError` | an unvouched value was passed to a sink parameter, or a runtime sink check failed |
| `ToolError` | a tool isn't configured, or returned something that doesn't match its schema |
| `PanicError` | integer division by zero, an index out of bounds, a missing map key |
| `DecodeError` | a JSON value doesn't match a type |

## Values

| Wardscript | Python |
|---|---|
| `Int`, `Float`, `String`, `Bool` | `int`, `float`, `str`, `bool` |
| `List<T>`, `Map<K, V>` | `list`, `dict` |
| `Option<T>` | the value, or `None` |
| record `Ticket` | frozen dataclass `Ticket` |
| enum without fields | `enum.Enum`: `Priority.Low.value == "Low"` |
| enum with fields | frozen dataclasses `Verdict.Fail("log")`, fields `_0`, `_1`, ... |

Names that clash with Python keywords get a trailing `_` (`from_`).

## Async

`ward build --async` generates `async def` functions. Models, approvers and tools
may then be sync or async. Each asyncio task is its own run, so concurrent runs
with `asyncio.gather` get separate traces and budgets.

## Streaming

A model with a `stream(request)` method streams its answer. Both built-in
providers do.

```python
runtime.configure(on_partial=lambda p: print(p.value, p.done))
```

`on_partial` is called each time the answer decodes further: a record fills in
field by field, strings grow as they're written, lists gain elements. The last
call, with `done=True`, has the complete value after it passed refinements and
checks. `on_stream` gets the raw text chunks instead.

A `tokens` budget is enforced while streaming: the stream is cut off as soon as
it goes over.

## Testing with a mock model

```python
from wardscript.mock import MockModel, Raw, Seq, Usage

runtime.configure(model=MockModel({
    "triage": {"customer": "Ada", "summary": "Refund", "priority": "Low"},
    "draft_reply": Seq(first_answer, second_answer),
}))
```

Answers are keyed by `ai fn` name. Use `Raw(text)` for literal text, `Seq(...)`
for one answer per call, `Usage(answer, tokens=, cost=)` to report usage, or a
function of the request. Exceptions such as `RateLimited("429")` can be answers
too. Every request is recorded in `model.calls`.
