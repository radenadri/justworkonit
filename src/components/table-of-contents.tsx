import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`\[\]]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    items.push({ id, text, level });
  }

  return items;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const headings = extractHeadings(content);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className={cn("w-48 shrink-0", className)}>
      <div className="sticky top-20 py-6 pl-4">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
          On this page
        </h4>
        <ul className="space-y-1 border-l border-border-light">
          {headings.map(({ id, text, level }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  "block text-xs py-1 transition-colors duration-100 border-l-2 -ml-px",
                  level === 1 && "pl-3",
                  level === 2 && "pl-3",
                  level === 3 && "pl-6",
                  level === 4 && "pl-9",
                  activeId === id
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border-light"
                )}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
