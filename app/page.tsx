import Link from "next/link";
import { highlight } from "../lib/markdown";
import { REPO } from "../lib/docs";

const HERO = `import mcp "gmail" as mail

type Reply { subject: String, body: String }

// The model's output is untrusted: it was shaped by the email.
ai fn draft_reply(email: Untrusted<String>) -> Reply {
    "Write a short, polite reply to this email:\\n{email}"
}

fn no_links(text: String) -> Bool {
    !text.contains("http://") && !text.contains("https://")
}

pub fn answer(email: Untrusted<String>, to: String) -> String throws String
    uses {llm, mail.send}
{
    let reply = draft_reply(email)
    let subject = validate(reply.subject, no_links)?
    let body = validate(reply.body, no_links)?
    mail.send(to, subject, body)
    return "sent"
}`;

const ERROR = `[W0107] Error: untrusted data reaches the tool call \`mail.send_email\`
    ╭─[ agent.ward:16:50 ]
 16 │         mail.send_email(owner, "Re: your email", reply)?
    │                                                  ──┬──
    │                                                    ╰── 3. passed to \`mail.send_email\` as \`body\`
 15 │         let reply = next_action(message)
    │             ──┬──   ──────────┬─────────
    │               ╰───────────────────────── 2. stored in \`reply\`
    │                               ╰───────── 1. output of \`ai fn next_action\`
    │ Help: \`validate(x, rule)?\`, \`approve(x)\`, or \`declassify(x, "why")\``;

const FEATURES = [
  { t: "Trust labels", d: "Values are Trusted or Untrusted. Model output, tool results and network input are untrusted; tool arguments are sinks. The checker tracks every flow.", href: "/docs/spec/trust/" },
  { t: "AI functions", d: "An ai fn's body is its prompt and its return type is the schema. Answers are validated, refined with where clauses, and retried with the reason when they fail.", href: "/docs/spec/types/" },
  { t: "Effects & budgets", d: "Declare uses {llm, mail.send} and budget {calls: 3, cost: 0.10}. The Rule of Two is enforced at compile time; unknown cost fails closed.", href: "/docs/spec/effects/" },
  { t: "Typed MCP tools", d: "import mcp \"gmail\" as mail. Tool schemas are pinned in ward.lock, calls are type-checked, and sink parameters are guarded.", href: "/docs/spec/tools/" },
  { t: "Python & TypeScript", d: "Compile to a Python module with .pyi stubs or to TypeScript for Node, backed by a Rust core, audit traces and OTLP export.", href: "/docs/spec/runtime/" },
  { t: "Recorded tests", d: "test blocks replay recorded model answers and tool results, so ward test is deterministic in CI. ward test --record captures new ones.", href: "/docs/spec/testing/" },
];

export default async function Home() {
  const [hero, err] = await Promise.all([highlight(HERO, "ward"), highlight(ERROR, "text")]);
  return (
    <main>
      <section className="hero">
        <div className="hero-text">
          <span className="pill">Beta · v0.1</span>
          <h1>Prompt injection is a <em>compile error</em>.</h1>
          <p className="lede">
            Wardscript is a small, typed language for trustworthy AI functions and agents. Its compiler proves that
            untrusted data — LLM output, tool results, network input — can&apos;t reach a sensitive action without an
            explicit <code>validate</code>, <code>approve</code> or <code>declassify</code>.
          </p>
          <div className="cta">
            <Link href="/docs/" className="btn primary">Get started</Link>
            <Link href="/docs/demo/" className="btn">See the demo</Link>
          </div>
          <pre className="install"><span className="muted">$</span> curl -fsSL https://raw.githubusercontent.com/ahmedelraei/wardscript/main/install/install.sh | sh</pre>
        </div>
        <div className="hero-code">
          <div className="window"><span /><span /><span /><b>answer.ward</b></div>
          <div dangerouslySetInnerHTML={{ __html: hero }} />
        </div>
      </section>

      <section className="band">
        <div className="band-inner two">
          <div>
            <h2>Remove a <code>validate</code>, and it doesn&apos;t build</h2>
            <p>
              <code>ward check</code> reports <strong>W0107</strong> with the exact path untrusted data took — from the
              model&apos;s answer, through your variables, into the tool call. Fix it with a validation rule, a human
              approval, or a documented declassification. Every approval lands in the audit trace.
            </p>
            <Link href="/docs/spec/diagnostics/" className="link">All diagnostics →</Link>
          </div>
          <div className="err" dangerouslySetInnerHTML={{ __html: err }} />
        </div>
      </section>

      <section className="features">
        <h2>Everything an agent needs, checked</h2>
        <div className="grid">
          {FEATURES.map((f) => (
            <Link key={f.t} href={f.href} className="card">
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="band-inner">
          <h2>0 of 489 attacks reach their goal</h2>
          <p>
            The banking, Slack and workspace suites of <a href="https://github.com/ethz-spylab/agentdojo" target="_blank" rel="noreferrer">AgentDojo</a>,
            a prompt-injection benchmark, are ported to Wardscript — one program per user task — with an attacker who
            controls every model answer.
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th /><th>Tasks that succeed</th><th>Attacks that reach their goal</th></tr></thead>
              <tbody>
                <tr><td>Our port</td><td>77 / 77</td><td><strong>0 / 489</strong></td></tr>
                <tr><td>Blind port, written without seeing the attacks</td><td>71 / 77</td><td>4 / 489</td></tr>
              </tbody>
            </table>
          </div>
          <div className="charts">
            <img src="/img/agentdojo-attacks.svg" alt="Our port blocked 481 attacks and 8 needed a human; 0 got through. The blind port blocked 431, 54 needed a human, 4 got through." />
            <img src="/img/agentdojo-utility.svg" alt="User tasks that succeed per suite: our port 16/16, 21/21, 40/40; the blind port 16/16, 16/21, 39/40." />
          </div>
          <p className="muted small">
            Utility uses scripted model answers, and published results for other defenses measure general agents with
            real models, so the numbers aren&apos;t directly comparable. <a href={`${REPO}/tree/main/benchmarks/agentdojo`} target="_blank" rel="noreferrer">Method and limits</a>.
          </p>
        </div>
      </section>

      <section className="closing">
        <h2>Start in a minute</h2>
        <pre className="install block">{`ward init hello && cd hello
ward check main.ward
ward test main.ward
ward run main.ward reply '"Where is my order?"' --model anthropic`}</pre>
        <div className="cta center">
          <Link href="/docs/" className="btn primary">Read the guide</Link>
          <Link href="/examples/" className="btn">Browse examples</Link>
        </div>
      </section>
    </main>
  );
}
