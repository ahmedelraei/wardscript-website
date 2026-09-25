# Effects and budgets

## Effects

A function's `uses` clause lists what it does besides computing a value:

```ward
import mcp "gmail" as mail

pub fn answer(email: Untrusted<String>, to: String) -> String throws String
    uses {llm, mail.send}
{
    ...
}
```

| Effect | Covers |
|---|---|
| `llm` | calling an `ai fn` |
| `mail` | every function of the tool imported as `mail` |
| `mail.send` | only calls to `mail.send` |

A function must declare everything it does, including what the functions it
calls do. A function without a `uses` clause is pure. The compiler points at the
call that needs a missing effect and suggests the full clause.

To declare an effect used by a helper in another module, import the tool in your
module too.

## Budgets

A budget caps what a function may spend, including everything it calls:

```ward
pub fn handle(email: Untrusted<String>) -> String
    uses {llm, mail}
    budget {tokens: 8000, calls: 5, cost: 0.10, time: 60}
```

| Budget | Limits |
|---|---|
| `tokens` | model tokens, prompt and answer |
| `calls` | model requests, retries included |
| `cost` | dollars spent on models |
| `time` | seconds of wall-clock time |

When a function goes over, the run stops with `BudgetExceeded`:

- `calls` is checked before each request, so a request over the limit is never sent;
- `tokens` and `cost` are checked after each answer (and during streaming);
- `time` is checked before and after each model and tool call.

The compiler also catches budgets that can never be met, for example `calls: 1`
on a function that always makes two model calls.

### Unknown cost fails closed

If a function has a `cost` budget but the model's price isn't known, the call is
refused with `BudgetUnenforceable` rather than spending money that can't be
counted. Give the provider its prices (see [Models](../guides/models.md)), or
opt out with `configure(unpriced="warn")`.

## The Rule of Two

A function may not have all three of these at once, counting what it calls:

| Capability | Comes from |
|---|---|
| processes untrusted input | an `Untrusted` parameter, or the result of an `ai fn` or a non-private tool |
| reads private data | a tool function marked `@private` |
| changes external state or communicates | a tool function not marked `@private` or `@readonly` |

An agent that reads untrusted input *and* your private data *and* can send
things out is exactly the shape a prompt injection exploits. The compiler rejects
it (W0220) and shows where each capability came from.

Tell the compiler about your tools on the import:

```ward
@readonly(get_issue, search)
@private(read_file)
import mcp "github" as gh
```

Tools are otherwise classified by their schema: a tool whose schema says
`readOnlyHint: true` is read-only; anything else is assumed to change state.

When a human reviews what the function does, you can allow it with a reason:

```ward
@allow(rule_of_two, reason = "a human approves the full diff before anything is pushed")
pub fn fix_issue(repo: String, number: Int) -> String throws String
```

## Annotations

| Annotation | On |
|---|---|
| `@allow(rule_of_two, reason = "...")` | functions |
| `@private(f, ...)` | tool imports: these functions read private data |
| `@readonly(f, ...)` | tool imports: these functions don't change anything |
| `@sink(f.param, ...)` | tool imports: make these parameters sinks |
| `@not_sink(f.param, ..., reason = "...")` | tool imports: these parameters aren't sinks |
