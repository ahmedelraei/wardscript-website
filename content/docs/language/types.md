# Types

## Built-in types

| Type | Values |
|---|---|
| `Int`, `Float` | 64-bit integer and float |
| `String`, `Bool` | text and `true`/`false` |
| `List<T>` | immutable list: `[1, 2, 3]` |
| `Map<K, V>` | immutable map |
| `Option<T>` | `Some(x)` or `None` |

## Records

```ward
pub type Ticket {
    customer: String,
    summary: String,
    tags: List<String>,
}

let t = Ticket { customer: "Ada", summary: "Refund", tags: [] }
let summary = t.summary
```

`Ticket { customer }` is shorthand for `Ticket { customer: customer }`. Records
can be generic: `type Page<T> { items: List<T>, next: Option<String> }`.

## Enums

```ward
pub enum Category {
    Billing,
    Bug(String),
    Other,
}

let c = Category.Bug("checkout")
```

Variants are reached through their enum (`Category.Billing`), except `Some` and
`None`. Use `match` to take them apart.

## Type aliases

```ward
type Subject = String where it.len() <= 80
type Inbox = List<Untrusted<String>>
```

## Refinements

A refinement narrows a type with a condition on the value, called `it`:

```ward
type Subject = String where it.len() <= 80 && !it.contains("\n")

pub type Review {
    stars: Int where it >= 1 && it <= 5,
    tags: List<String> where it.len() <= 3,
}
```

Refinements are checked whenever a value comes in from outside: model answers,
tool results and `ward run` arguments. A model answer that fails one is retried
with the reason. Simple conditions (lengths and numeric bounds) are also sent to
the model as part of the JSON schema, so structured output can enforce them.

Refinements can go on record fields, enum variant payloads, type aliases and
`ai fn` return types. The condition can only use `it`, literals, operators,
fields, built-in methods and enum variants. To refine a type argument, name it
with an alias first (`List<Subject>`).

## Classes

Records and enums are values. For shared, changing state, use a
[class](classes.md).

## Trust labels

`Untrusted<T>` and `Trusted<T>` are the type `T` with a trust label. They're
covered in [Trust](trust.md).

## Built-in methods

Lists and maps are immutable: `push` and `insert` return a new collection.

| Type | Methods |
|---|---|
| `String` | `len()`, `is_empty()`, `contains(s)`, `starts_with(s)`, `ends_with(s)`, `trim()`, `lower()`, `upper()`, `split(sep)`, `lines()`, `replace(from, to)` |
| `List<T>` | `len()`, `is_empty()`, `contains(x)`, `get(i) -> Option<T>`, `first()`, `last()`, `push(x)` |
| `Map<K, V>` | `len()`, `is_empty()`, `get(k) -> Option<V>`, `contains_key(k)`, `keys()`, `values()`, `insert(k, v)` |
| `Option<T>` | `is_some()`, `is_none()`, `unwrap_or(default)` |
| `Int` | `to_string()`, `to_float()` |
| `Float` | `to_string()`, `round()` |
| `Bool` | `to_string()` |

`xs[i]` indexes a list with an `Int` and a map with its key type. Indexing out
of bounds, a missing map key, and integer division by zero stop the program with
a runtime error.
