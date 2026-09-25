# Trust

Trust checking is the heart of Wardscript. Every value is **trusted** or
**untrusted**, and the compiler proves that untrusted data never reaches a
**sink** (an action with consequences) without passing an explicit check first.

## Where untrusted data comes from

- the result of every `ai fn` call;
- the result of every tool call, and anything read from it;
- parameters, fields and variables declared `Untrusted<T>`.

Combining values gives the least trusted of them: `"Re: " + subject` is untrusted
if `subject` is.

## Sinks

- arguments of tools that can change something or reach the outside world
  (sending mail, running commands, writing files);
- anything declared `Trusted<T>`: parameters, return types, variables and record
  fields;
- parameters of your own functions that reach a sink inside them. This is
  inferred, so a helper that forwards its argument to a tool needs trusted data
  too.

Passing untrusted text to a model is fine: `ai fn` arguments aren't sinks.

## Labels in signatures

Labels only need to be written in signatures, `let` annotations and type
declarations. Inside a function they're inferred.

| Written | Meaning |
|---|---|
| `x: Untrusted<T>` | untrusted, whatever the caller passes |
| `x: Trusted<T>` | callers must pass trusted data |
| `x: T` | as trusted as whatever the caller passes |
| `-> Trusted<T>` | everything the function returns must be trusted |
| `-> T` | as trusted as the data it came from |

A type is untrusted if `Untrusted<...>` appears anywhere in it, so
`List<Untrusted<String>>` is an untrusted list.

## Making data trusted

There are three ways, and each is recorded in the audit trace when it happens.

| | Use when |
|---|---|
| `validate(x, rule)?` | a function `rule(x) -> Bool` can check the value. Throws if it returns `false`. |
| `approve(x)` | a human should look at the value before it's used. Denied approvals stop the run. |
| `declassify(x, "reason")` | you know the value is safe. The reason is recorded for reviewers. |

```ward
fn is_order_id(s: String) -> Bool {
    s.len() == 8 && !s.contains(" ")
}

let order = validate(ticket.order_ref, is_order_id)?
shop.refund(order)?

mail.send_email(to, "Re: your order", approve(draft.body))?

let label = declassify(ticket.category, "a fixed set of labels, only shown to staff")
```

Checks on an `ai fn` and refinements on its type **don't** make its answer
trusted: they describe the answer's shape, not who shaped it.

## How data flows

The checker follows data through operators, string templates, method calls,
lists, records, indexing, field access and function calls.

It also follows **implicit** flows, where untrusted data decides what happens:

```ward
import mcp "shell" as sh

pub fn cleanup(reply: Untrusted<String>) throws String
    uses {sh}
{
    let command = "ls"
    if reply.contains("delete") {
        command = "rm -rf /"
    }
    sh.run(command)?  // error: whether `command` changed depends on `reply`
}
```

- An `if` or `match` on untrusted data produces an untrusted value.
- Inside a branch or loop controlled by untrusted data, assignments to variables
  from outside it become untrusted.
- A `return` under an untrusted condition makes the result untrusted.

Calling a sink *under* an untrusted condition with trusted arguments is fine.
This checks:

```ward
if reply.contains("urgent") {
    mail.send(ops, "Urgent ticket", "A customer needs help.")?
}
```

The checker tracks what data reaches a sink, not whether the sink is reached.

## The error

When untrusted data can reach a sink, `ward check` reports **W0107** with the
path the data took, step by step:

```text
[W0107] Error: untrusted data reaches the tool call `sh.run`
   ╭─[ cleanup.ward:9:12 ]
 4 │ pub fn cleanup(reply: Untrusted<String>) {
   │                ────────────┬───────────
   │                            ╰───────────── 1. `reply` is declared `Untrusted`
 6 │     if reply.contains("delete") {
   │        ────────────┬───────────
   │                    ╰───────────── 2. the branch taken depends on this
 7 │         command = "rm -rf /"
   │         ───┬───
   │            ╰───── 3. assigned here, where whether this runs depends on it
 9 │     sh.run(command)
   │            ───┬───
   │               ╰───── 4. passed to `sh.run` here
```

## At run time

The guarantees continue past the compiler:

- **Your application's inputs.** Anything your application passes in is
  untrusted by default. A parameter that reaches a sink only accepts a value your
  code explicitly vouches for with `Trusted(...)`, otherwise the call fails with
  `TrustError`. See [Python](../guides/python.md#passing-trusted-values).
- **Sink checks.** Before every tool call, the runtime checks that no argument is
  exactly an untrusted value from this run that nothing cleared. This is a second
  line of defense in case generated code is edited by hand.
