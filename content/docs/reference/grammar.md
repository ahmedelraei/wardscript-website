# Grammar

The formal grammar of Wardscript. For a gentler introduction, see
[Language basics](../language/basics.md).

## Lexical structure

- Source is UTF-8. `//` starts a comment that runs to the end of the line.
- Whitespace is insignificant, except that a line break can end a statement
  (see [Statements](#statements-and-line-breaks)).
- **Identifiers**: `[A-Za-z_][A-Za-z0-9_]*`. A lone `_` is the wildcard pattern.
- **Keywords** (reserved; can't be used as names):
  `ai fn pub let type enum match if else for in while return throw throws try catch import as uses budget true false`.
  `model` and `check` are keywords only where a clause can start (`model {`, `check {`),
  `where` only after a type, `test` only before a string at the top level, and
  `assert` only at the start of a statement in a test; elsewhere they're names.
- **Integers**: `[0-9][0-9_]*`, 64-bit signed. `_` separators are ignored (`1_000`).
- **Floats**: `[0-9][0-9_]*.[0-9][0-9_]*`. No exponent form; a leading digit is required.
- **Strings**: `"..."`, may span lines. Escapes: `\n \r \t \0 \\ \"`.
- **String templates**: `{expr}` inside a string interpolates an expression, e.g.
  `"Hello {user.name}"`. A literal brace is written doubled, `{{` or `}}`, as in Python f-strings. The expression
  can't contain a `"` (so no nested string literals).
- **Operators and punctuation**:
  `( ) { } [ ] , ; : . -> => + - * / % == != < <= > >= && || ! = ? @`

## Grammar

```ebnf
module      = item* ;
item        = annotation* (import | ["pub"] (fn | ai_fn)) | ["pub"] (type | enum) | test ;
test        = "test" STRING block ;                       (* run by `ward test` *)
annotation  = "@" IDENT ["(" [annotation_arg ("," annotation_arg)* [","]] ")"] ;
annotation_arg = IDENT ("." IDENT)* ["=" STRING] ;                     (* rule_of_two, reason = "..." *)

import      = "import" path ["as" IDENT]                 (* module import *)
            | "import" IDENT STRING "as" IDENT ;         (* tool import: import mcp "gmail" as mail *)

fn          = "fn" IDENT signature block ;
ai_fn       = "ai" "fn" IDENT signature "{" STRING "}" ;   (* the body is only the prompt *)
signature   = [generics] "(" [param ("," param)* [","]] ")" ["->" rtype] ["throws" type] clause* ;
param       = IDENT ":" rtype ;
clause      = "uses" "{" [effect ("," effect)* [","]] "}"
            | "budget" "{" [IDENT ":" expr ("," IDENT ":" expr)* [","]] "}"
            | "model" "{" [model_entry ("," model_entry)* [","]] "}"
            | "check" "{" [check_entry ("," check_entry)* [","]] "}" ;
check_entry = expr ["=>" STRING] ;                       (* a condition on `it`, and why *)
model_entry = IDENT ":" (IDENT | INT | FLOAT | "[" [IDENT ("," IDENT)* [","]] "]") ;
effect      = IDENT ("." IDENT)* ;                       (* llm, mail, mail.send *)

type_decl   = "type" IDENT [generics] "{" [field ("," field)* [","]] "}"   (* record *)
            | "type" IDENT [generics] "=" rtype ;                          (* alias *)
field       = IDENT ":" rtype ;
enum        = "enum" IDENT [generics] "{" [variant ("," variant)* [","]] "}" ;
variant     = IDENT ["(" rtype ("," rtype)* [","] ")"] ;
generics    = "<" IDENT ("," IDENT)* [","] ">" ;

type        = path ["<" type ("," type)* [","] ">"] ;    (* String, List<T>, Untrusted<Ticket> *)
rtype       = type ["where" expr_ns] ;                  (* String where it.len() <= 80 *)
path        = IDENT ("." IDENT)* ;

block       = "{" stmt* [expr] "}" ;                     (* the trailing expr is the block's value *)
stmt        = ( "let" IDENT [":" type] "=" expr
              | "return" [expr]
              | "throw" expr
              | "for" IDENT "in" expr_ns block
              | "while" expr_ns block
              | "assert" expr ["=>" STRING]              (* only in tests *)
              | expr "=" expr                            (* target: name, field or index *)
              | expr ) end ;
end         = ";" | line break | before "}" ;

expr        = binary ;
unary       = ("-" | "!") unary | postfix ;
postfix     = primary ( "." IDENT | "(" args ")" | "[" expr "]" | "?" )* ;
primary     = INT | FLOAT | STRING | "true" | "false"
            | IDENT
            | path "{" [field_init ("," field_init)* [","]] "}"    (* record literal; not in expr_ns *)
            | "(" expr ")"
            | "[" [expr ("," expr)* [","]] "]"
            | block_like ;
field_init  = IDENT [":" expr] ;                         (* `Ticket { title }` is shorthand *)
block_like  = if | match | try | block ;
try         = "try" block "catch" (IDENT | "_") block ;
if          = "if" expr_ns block ["else" (if | block)] ;
match       = "match" expr_ns "{" arm* "}" ;
arm         = pattern "=>" expr [","] ;                  (* "," or a line break between arms *)

pattern     = "_" | literal | "-" (INT | FLOAT)
            | path ["(" [pattern ("," pattern)* [","]] ")"] ;
```

`expr_ns` is an expression where a record literal isn't allowed at the top level,
because the `{` would be ambiguous with the block that follows (`if x { ... }`).
Wrap it in parentheses if needed: `if (Point { x: 1 }) == p { ... }`.

### Operator precedence

From loosest to tightest. Binary operators are left-associative, except
comparisons, which can't be chained (`a < b < c` is error W0019).

| Level | Operators |
|---|---|
| 1 | `\|\|` |
| 2 | `&&` |
| 3 | `== != < <= > >=` (non-associative) |
| 4 | `+ -` |
| 5 | `* / %` |
| 6 | unary `-` `!` |
| 7 | postfix: `.field`, call `f(...)`, index `x[i]`, `?` (after a call that may throw) |
