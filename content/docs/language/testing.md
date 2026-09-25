# Testing

Tests live next to the code they test and replay recorded model answers, so they
are fast, free and deterministic.

```ward
test "a double charge goes to billing" {
    let ticket = triage("I was charged twice for my subscription this month.")
    assert queue(ticket) == "billing" => "a double charge is a billing question"
    assert ticket.order_id.is_none()
}
```

## Writing tests

- `test "name" { ... }` goes at the top level of a file. Names must be unique.
- `assert condition` and `assert condition => "message"` check a `Bool`. A failed
  assertion fails the test with the message (or the condition's text) and where
  it is.
- `?` works on any call inside a test; an uncaught error fails the test.
- Tests are trust-checked like any other code, and don't need to declare effects.
- `approve(...)` is always granted in tests.
- Tests are left out of `ward build` output.

## Recording

The first time, run the tests against a real model to record what it answers:

```bash
ward test triage.ward --record --model anthropic
```

Or record from canned answers:

```bash
ward test triage.ward --record --mock answers.json
```

This writes `triage.recordings.json` next to the program, with every model answer
and tool result each test received. Commit it.

## Replaying

```bash
ward test triage.ward             # all tests
ward test triage.ward billing     # only tests whose names contain "billing"
```

Replays send nothing to models or tools. They're strict: a test fails if it asks
a different prompt, calls a different tool or different arguments, or makes more
or fewer calls than were recorded. After changing a prompt or a test, record it
again.

Budgets still apply during replay, using the recorded token counts and costs.

`ward test` exits with 0 when every test passes and 4 when one fails, so it slots
straight into CI.

## Options

| Option | |
|---|---|
| `--record` | run against a model and write recordings |
| `--model SPEC` | model to record with, e.g. `anthropic` or `fast=anthropic:<model>` |
| `--mock FILE` | record from canned answers instead |
| `--recordings PATH` | use a different recordings file |
| `--trace-dir DIR` | write an audit trace for each test |

## The recordings file

```json
{
  "version": 1,
  "tests": {
    "a double charge goes to billing": [
      {"kind": "model", "function": "triage", "model": null, "prompt": "...",
       "text": "{...}", "tokens": 812, "cost": 0.0031},
      {"kind": "tool", "tool": "gmail", "function": "send_email",
       "arguments": {"to": "...", "subject": "...", "body": "..."}, "result": "sent"}
    ]
  }
}
```

It's plain JSON and can be edited by hand, for example to test how your code
handles a model error (`"error": {...}` in place of `"text"`) or a failing tool
(`"thrown"`).
