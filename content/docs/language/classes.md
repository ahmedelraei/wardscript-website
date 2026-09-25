# Classes

Records are immutable values: assigning a field makes a copy. When several parts
of a program need to see the **same changing state**, like an agent's memory or a
counter, use a class. Objects are shared by reference, and their fields can be
changed in place.

```ward
pub open class Agent {
    pub name: String
    notes: Untrusted<List<String>>
    calls: Int

    pub init(name: String) {
        self.name = name
        self.notes = []
        self.calls = 0
    }

    pub open fn handle(text: Untrusted<String>) -> String {
        self.calls = self.calls + 1
        self.notes = self.notes.push(text)
        "{self.name} has {self.notes.len()} notes"
    }

    pub ai fn summarize() -> String {
        "Summarize these notes:\n{self.notes}"
    }
}

pub class Shouter: Agent {
    pub override fn handle(text: Untrusted<String>) -> String {
        super.handle(text).upper()
    }
}

pub fn main() -> String {
    let a: Agent = Shouter("bot")
    a.handle("hi")
}
```

## Declaring a class

A class has fields, an `init` and methods, one per line.

- **Fields** have a type, and may be declared `Untrusted<T>` (see [Trust](#trust)).
- **`init`** sets up a new object. It must assign every field with
  `self.field = ...`, directly in its body rather than inside an `if` or a loop.
  A class with fields needs an `init`.
- **Methods** are functions that can use `self`. They can have everything a
  function has: `throws`, `uses`, `budget` and annotations. A method can be an
  `ai fn`, whose prompt can read `self`'s fields.

Classes can't be generic yet.

## Creating and using objects

```ward
let agent = Agent("bot")      // runs init
agent.handle("hello")         // calls a method
agent.calls = 0               // changes the field in place
```

Every variable holding the same object sees the change. `==` on objects compares
identity.

Objects can't be matched with patterns and have no JSON schema, so an `ai fn`
can't return one. Use a record for data that goes to or from a model or your
application.

## Visibility

Members are private unless marked `pub`. A private field, method or `init` can
only be used inside the class and its subclasses. To use a class from another
module, the class itself must be `pub`.

## Inheritance

`class B: A` extends `A`. A class has one base, and the base must be declared
`open class` or `abstract class`. An object of `B` can be used wherever an `A` is
expected.

- Only methods marked `open` (or abstract, or already an `override`) can be
  overridden, and the overriding method must say `override`. It must have the same
  parameters, return type, `throws` type and visibility.
- Calls are **virtual**: `a.handle(x)` runs the version from the class the object
  was created from.
- `super.method(...)` calls the base class's version.
- If the base class has an `init`, a subclass's `init` must start with
  `super.init(...)`. A subclass with no fields of its own can skip `init` and
  inherit the base's.

`List<B>` is not a `List<A>`; only the object itself converts.

## Interfaces and abstract classes

```ward
pub interface Named {
    fn name() -> String
}

pub abstract class Shape: Named {
    pub abstract fn area() -> Float

    pub override fn name() -> String {
        "shape"
    }
}

pub class Square: Shape, Named {
    side: Float

    pub init(side: Float) {
        self.side = side
    }

    pub override fn area() -> Float {
        self.side * self.side
    }
}
```

- An **interface** lists method signatures, without bodies, fields or `init`. Its
  methods are public. Interfaces can extend other interfaces:
  `interface Greeter: Named, Polite`.
- An **abstract class** can't be created directly, and can declare
  `abstract fn` methods without a body. It can be extended without `open`.
- After `:`, write the base class first, then the interfaces.
- A class implements an abstract method with `pub override fn` and the same
  signature. A class you can create must implement every abstract method it
  inherits.

## Trust

Because objects are shared, a field's trust comes from its declaration, not from
whatever was stored last:

- A field declared `Untrusted<T>` can hold untrusted data, and reading it is
  always untrusted.
- Any other field only ever holds **trusted** data. Storing an untrusted value
  in it is an error (W0107), and so is storing under a condition that depends on
  untrusted data.

```ward
class Draft {
    body: String

    init() {
        self.body = ""
    }
}

fn fill(d: Draft, reply: Untrusted<String>) {
    d.body = reply      // error: `Draft.body` isn't declared Untrusted
}
```

So a method that stores its parameter in a trusted field needs trusted arguments,
and a constructor's arguments usually must be trusted too, since `init` stores
them.

A virtual call might run any override in the program, so it takes the strictest
requirements of all of them: if one override sends a parameter to a tool, every
call through the base class must pass trusted data.

## Effects

A method declares its effects like a function. A virtual call uses the effects of
every override, so the caller declares all of them.

## From Python and TypeScript

**Python.** A class becomes a Python class with the same name and base, and `init`
becomes `__init__`, so you create objects with `Agent("bot")`. Interfaces become
`typing.Protocol`s. With `--async`, create objects with `await Agent._new(...)`.
Arguments that must be trusted need `Trusted(...)`, as for functions.

**TypeScript.** A class becomes a TypeScript class, interfaces become TypeScript
interfaces, and abstract stays abstract. Create objects with
`await Agent$new(...)`.

Each method call from your application is its own run in the audit trace, named
`Class.method`.
