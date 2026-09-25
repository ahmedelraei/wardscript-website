# Models

## Providers

Wardscript has built-in providers for Anthropic and OpenAI.

On the command line, `--model` picks one:

```bash
ward run app.ward main --model anthropic                 # the provider's default model
ward run app.ward main --model anthropic:claude-sonnet-5
ward run app.ward main --model openai:<model>
```

From Python:

```python
from wardscript import runtime
from wardscript.providers.anthropic import Anthropic
from wardscript.providers.openai import OpenAI

runtime.configure(model=Anthropic("claude-sonnet-5", prices=(3.0, 15.0)))
```

- API keys come from `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`, or pass a
  configured SDK client with `client=`.
- `prices` are dollars per million input and output tokens. They're what lets
  `cost` budgets work: without them the cost is unknown, and a function with a
  `cost` budget refuses to call the model.
- The return type's schema is passed to the API as structured output, and the
  answer is still validated and retried as usual.

### Your own model

Anything with a `complete(request)` method works as a model. It receives an
`AiRequest` (the `function` name, the filled-in `prompt`, the JSON `schema`, the
`attempt` number and earlier `errors`; `request.instructions()` combines them)
and returns JSON text, or a `Completion(text, tokens, cost)` to report usage.

## Model policies

An `ai fn` can choose models by alias, with retries and fallbacks:

```ward
ai fn triage(email: Untrusted<String>) -> Ticket
    model {primary: fast, fallback: [smart, backup], retries: 2, backoff: 0.5}
{
    "..."
}
```

| Setting | | Default |
|---|---|---|
| `primary` | alias asked first | the configured default model |
| `fallback` | alias or list of aliases tried in order | none |
| `retries` | retries after a rate limit or outage | 2 |
| `backoff` | seconds before the first such retry, doubling each time | 1.0 |

Bind the aliases when you run the program:

```bash
ward run app.ward main --model fast=anthropic:<model> --model smart=anthropic:<model>
```

```python
runtime.configure(models={"fast": Anthropic("..."), "smart": Anthropic("...")})
```

For each model in turn:

1. Rate limits and outages are retried after the backoff, up to `retries` times.
2. Invalid answers (wrong shape, failed refinement or check) are retried with the
   reason.
3. If the model keeps failing, the next fallback is tried. A rejected request
   moves on immediately.

If every model fails, the last error is raised. Every attempt counts against
budgets, and each one appears in the audit trace.
