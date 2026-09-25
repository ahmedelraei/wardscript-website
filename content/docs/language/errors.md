# Errors

Wardscript uses exceptions for errors, and makes every place one can happen
visible.

## Throwing

A function declares what it may throw after its return type:

```ward
enum ParseError {
    Empty,
    NotANumber(String),
}

fn parse_level(s: String) -> Int throws ParseError {
    if s.is_empty() {
        throw ParseError.Empty
    }
    ...
}
```

Any type can be thrown: a `String`, a record or an enum. A function throws one
type.

## Calling with `?`

A call to a function that may throw must be marked with `?`:

```ward
let level = parse_level(input)?
```

The error then propagates, so the calling function must either declare the same
`throws` type or catch it. A `?` on a call that can't throw is an error too, so
`?` always means "this may exit early".

## Catching

`try`/`catch` is an expression:

```ward
let level = try {
    parse_level(input)?
} catch err {
    0
}
```

`err` has the thrown type; `catch _` ignores it. One `try` catches one error type.

## What can throw

- Functions that declare `throws`.
- Tool calls, which throw a `String` when the tool reports an error.
- `validate(x, rule)`, which throws a `String` when the rule rejects the value.

## Runtime errors

Some failures aren't exceptions and can't be caught by `try`: a model that never
gives a valid answer, a budget that runs out, an approval that's denied, an index
out of bounds. They stop the run and are reported to your application. See
[Python](../guides/python.md#errors) for the full list.

There is no `Result` type.
