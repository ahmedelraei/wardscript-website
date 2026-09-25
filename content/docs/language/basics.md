# Language basics

Wardscript looks like a small, expression-oriented cousin of Rust or Swift.
Source files end in `.ward` (or `.wardscript`).

## Comments and literals

```ward
// A comment runs to the end of the line.

let count = 1_000        // Int: 64-bit signed, `_` separators allowed
let ratio = 0.25         // Float: a leading digit is required
let ok = true            // Bool
let name = "Ada"         // String, may span lines
let greeting = "Hello {name}, you have {count} messages"
let braces = "{{literal braces}}"
```

String escapes are `\n \r \t \0 \\ \"`. `{expr}` inside a string interpolates an
expression; the expression can't contain another string literal.

## Variables

```ward
let total = 0
let names: List<String> = []
total = total + 1
```

`let` introduces a variable; its type is inferred from use. Variables can be
reassigned, and a later `let` may shadow an earlier one.

Values themselves are immutable. Assigning to a field or element makes an
updated copy:

```ward
ticket.summary = "Updated"   // `ticket` now holds a new record
items[0] = "first"
```

## Statements and line breaks

There are no required semicolons: a line break ends a statement. Use `;` to put
two statements on one line.

A line break does **not** end a statement inside `( )`, `[ ]` or a record
literal's `{ }`, after a binary operator at the end of a line, or before a line
starting with `.`:

```ward
let total = subtotal +
    shipping

let words = text
    .trim()
    .split(" ")
```

## Functions

```ward
fn add(a: Int, b: Int) -> Int {
    a + b
}

pub fn greet(name: String) -> String {
    "Hello {name}"
}
```

- A block's last expression is its value. `return` exits early.
- A function without `-> T` returns nothing.
- Parameter and return types are required; types inside bodies are inferred.
- `pub` makes a function, type or enum visible to other modules.
- Functions can be generic: `fn first<T>(xs: List<T>) -> Option<T>`.

Functions can also carry clauses between the signature and the body:
`throws` ([errors](errors.md)), `uses` and `budget` ([effects](effects.md)).

## Control flow

`if`, `match` and blocks are expressions:

```ward
let label = if score > 90 { "great" } else { "ok" }

let queue = match ticket.category {
    Category.Billing => "billing",
    Category.Bug(component) => "engineering/{component}",
    _ => "support",
}
```

`match` must cover every case; the compiler tells you which value is missing.
Patterns can be literals, `_`, enum variants with nested patterns, `Some(x)` and
`None`.

Loops:

```ward
for line in text.lines() {
    count = count + 1
}

while count > 0 {
    count = count - 1
}
```

`for` iterates over a list's elements or a map's keys.

## Operators

From loosest to tightest:

| Operators | |
|---|---|
| `\|\|` | or |
| `&&` | and |
| `== != < <= > >=` | comparison (can't be chained: `a < b < c` is an error) |
| `+ -` | `+` also concatenates strings and lists |
| `* / %` | |
| `-x` `!x` | unary |
| `.field` `f(...)` `x[i]` `?` | postfix |

`Int` and `Float` never convert implicitly; use `.to_float()` and `.round()`.

## Modules and imports

One file is one module.

```ward
import support.tickets as t

fn escalate(ticket: t.Ticket) -> t.Ticket {
    t.Ticket { title: ticket.title, priority: t.Priority.High }
}
```

`import a.b` loads `a/b.ward` relative to the entry file's directory and binds it
as `b`, or as the name after `as`. Only `pub` items can be used from another
module. Modules may import each other in cycles.

Tool servers are imported with `import mcp "name" as x`; see [Tools](tools.md).

## Annotations

Annotations go on their own lines before a function or an import:

```ward
@allow(rule_of_two, reason = "a human approves every message")
pub fn reply(email: Untrusted<String>) { ... }
```

The available annotations are listed under [Effects](effects.md#annotations).

## Formatting

`ward fmt FILE...` formats code in place (4-space indent, trailing commas on
multi-line lists) and keeps comments. `ward fmt --check` fails if anything would
change, for use in CI.
