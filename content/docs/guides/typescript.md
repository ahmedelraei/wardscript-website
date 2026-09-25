# Using Wardscript from TypeScript

The same programs compile to TypeScript for Node. The compiler, and every
guarantee about trust, effects and budgets, is the same as for Python.

```bash
ward build triage.ward --target typescript -o src/generated
```

```ts
import { configure, MockModel } from "wardscript";
import { route } from "./generated/triage.ts";

configure({ model: new MockModel({ triage: { customer: "Ada", /* ... */ } }) });
console.log(await route("My checkout crashed"));
```

## Setup

- The runtime needs **Node 22** or later.
- Install the `wardscript` package from the
  [Wardscript repository](https://github.com/ahmedelraei/wardscript)
  (`crates/ward_runtime/ts`).
- Generated modules import each other with `.ts` extensions. Compile them with
  TypeScript 5.7+ and `allowImportingTsExtensions` with
  `rewriteRelativeImportExtensions`, or run them directly with
  `node --experimental-strip-types`.

## Functions

Every generated function is `async` and returns a `Promise`. `pub` functions are
exported. A parameter that must be trusted takes `T | Trusted<T>`, and a plain `T`
is refused with `TrustError`, just like in Python: wrap values you vouch for in
`Trusted`.

Each outermost call is a run with its own audit trace, in the same format as
Python's, so `ward trace show` reads it.

## The runtime

```ts
import { configure, reset, MockModel, Anthropic, OpenAI, loadMcpConfig } from "wardscript";
```

- `configure({ model, models, approver, tools, retries, modelRetries, backoff, traceDir, checkSinks, unpriced })`
  and `reset()`, as in [Python](python.md#configuration).
- `Anthropic` and `OpenAI` use `fetch` with no SDK, reading `ANTHROPIC_API_KEY`
  and `OPENAI_API_KEY`.
- `MockModel`, `Raw`, `Seq` and `Usage` for tests.
- `McpServer` and `loadMcpConfig("mcp.json")` for tools.
- The errors (`Thrown`, `AiOutputError`, `ModelError`, `BudgetExceeded`, ...),
  `Trusted`, `decode`, `encode`, `jsonSchema` and `lastRun()`.

## Values

| Wardscript | TypeScript |
|---|---|
| `Int`, `Float` | `number` (so `Int` is exact up to 2^53) |
| `String`, `Bool` | `string`, `boolean` |
| `List<T>` | `ReadonlyArray<T>` |
| `Map<K, V>` | `ReadonlyMap<K, V>` |
| `Option<T>` | the value, or `null` |
| record `Ticket` | `interface Ticket` with readonly fields |
| class `Agent` | `class Agent`, created with `await Agent$new(...)` |
| enum without fields | a union of string literals: `"Low" \| "Urgent"` |
| enum with fields | a union of `{ tag: "Bug", _0: string }` objects |

## Not yet supported

- Streaming and OTLP export.
- `ward run` and `ward test` always use the Python output.
