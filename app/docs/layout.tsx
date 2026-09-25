import { Sidebar, type SearchEntry } from "../../components/Sidebar";
import { sections, readDoc } from "../../lib/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const secs = sections();
  const index: SearchEntry[] = secs.flatMap((s) =>
    s.docs.map((d) => ({
      href: d.href + "/",
      title: d.title,
      section: s.title,
      text: readDoc(d).replace(/```[\s\S]*?```/g, " ").replace(/[#*`|>\-\[\]()]/g, " ").replace(/\s+/g, " ").slice(0, 4000),
    })),
  );
  return (
    <div className="docs">
      <Sidebar sections={secs} index={index} />
      {children}
    </div>
  );
}
