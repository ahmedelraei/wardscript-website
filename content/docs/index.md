# Introduction

Wardscript is a typed language for writing AI functions and agents that can't be
talked into doing something they shouldn't.

Every value in a Wardscript program is either **trusted** or **untrusted**. Model
answers, tool results and anything coming in from outside are untrusted. Actions
with consequences, like sending an email, running a command or writing a file,
are **sinks**. The compiler proves that untrusted data never reaches a sink unless
your program checked it, a human approved it, or you explicitly vouched for it.
If it can, the program doesn't compile, and the error shows the exact path the
data took.

```ward
import mcp "gmail" as mail

ai fn draft_reply(email: Untrusted<String>) -> String {
    "Write a short, polite reply to this email:\n\n{email}"
}

pub fn answer(email: Untrusted<String>, to: String) throws String
    uses {llm, mail.send}
    budget {calls: 3, cost: 0.05}
{
    let reply = draft_reply(email)
    mail.send_email(to, "Re: your email", approve(reply))?
}
```

Remove the `approve(...)` and `ward check` rejects the program: the reply was
shaped by an email anyone could have written, so it can't go out unreviewed.

## What you get

- **AI functions.** An `ai fn`'s body is its prompt and its return type is the
  schema the answer must match. Invalid answers are retried with the reason.
- **Trust checking.** Prompt injection paths are compile errors, not runtime
  surprises. See [Trust](language/trust.md).
- **Classes.** Classes, interfaces and abstract classes for state an agent keeps
  across calls, with fields that keep their trust label.
- **Effects and budgets.** Functions declare what they touch (`uses {llm, mail}`)
  and what they may spend (`budget {calls: 3, cost: 0.10}`).
- **Typed tools.** MCP servers are imported like modules, and their schemas are
  pinned in a lock file.
- **Deterministic tests.** Tests replay recorded model answers, so they run
  offline in CI.
- **Audit traces.** Every run records each model call, tool call and approval,
  and links every tool argument back to where it came from.
- **Python and TypeScript.** Programs compile to a Python module or to TypeScript
  for Node, so they drop into the application you already have.

## Where to go next

- [Install Wardscript](installation.md)
- [Write your first program](quickstart.md)
- [See a vulnerable agent get rejected](prompt-injection.md)
- [Contribute](https://github.com/ahmedelraei/wardscript/blob/main/CONTRIBUTING.md), or [report a security problem](https://github.com/ahmedelraei/wardscript/security/policy)

> Wardscript is in **beta**. The language and its diagnostics may still change
> between releases.
