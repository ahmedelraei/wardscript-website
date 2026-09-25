# Tools

Wardscript talks to tools through [MCP](https://modelcontextprotocol.io) servers.
A server is imported like a module:

```ward
import mcp "gmail" as mail

let ids = mail.list_messages("is:unread")?
mail.send_email(to, "Hello", body)?
```

## Configure servers

List your servers in `mcp.json`, in the same format other MCP clients use:

```json
{
  "mcpServers": {
    "gmail": {"command": "python3", "args": ["gmail_server.py"], "env": {}}
  }
}
```

## Lock their schemas

```bash
ward lock
```

`ward lock` starts each server, asks for its tools and writes their schemas to
`ward.lock` next to `mcp.json`. Commit this file: builds stay reproducible, and a
server changing its tools shows up in code review. In CI, `ward lock --check`
fails if the lock is out of date.

Only servers started with a `command` (stdio) are supported for now.

## Typed calls

With a schema in `ward.lock`, tool calls are type-checked. Unknown tools are an
error (with a "did you mean"), and arguments must match:

| JSON Schema | Wardscript |
|---|---|
| `string` | `String` |
| `integer` | `Int` |
| `number` | `Float` |
| `boolean` | `Bool` |
| `array` | `List<T>` |
| nullable type | `Option<T>` |
| `object` and anything else | dynamic |

- Arguments are positional: required parameters in schema order, then optional
  ones. Optional parameters have type `Option<T>` and can be left off the end.
- Tool names that aren't valid identifiers are adjusted: `send-email` becomes
  `send_email`.
- The result has the type of the tool's output schema, or `String` if it has none.
- Every tool call can throw a `String` (the tool's error message), so it needs
  `?` or a `try`.

Without a schema, calls accept any arguments and return a dynamic value, and
every argument is treated as a sink.

## Trust

A tool's result is always untrusted, whatever its schema says.

Every parameter of a tool that may change something or reach the outside world
is a [sink](trust.md#sinks). A tool whose schema says it only reads, and never
reaches outside its own system, has no sinks. You can adjust this on the import:

```ward
@private(list_messages, read_message)
@not_sink(label_message.label, reason = "labels are only visible to the mailbox owner")
import mcp "gmail" as mail
```

`@private` and `@readonly` also feed the [Rule of Two](effects.md#the-rule-of-two).

## Running with tools

`ward run` and `ward test --record` connect to the servers in the nearest
`mcp.json` automatically. From your own application:

```python
from wardscript import mcp, runtime

runtime.configure(tools=mcp.load_config("mcp.json"))
```

You can also pass plain functions or objects instead of MCP servers; see
[Python](../guides/python.md#configuration).
