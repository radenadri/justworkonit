import { useEffect, useState, useRef, useCallback } from "react";

interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from the rendered DOM
  const extractHeadings = useCallback(() => {
    const article = document.querySelector("article.prose");
    if (!article) return;

    const elements = article.querySelectorAll("h1, h2, h3, h4");
    const extracted: TocHeading[] = [];

    elements.forEach(el => {
      const id = el.id;
      const text = el.textContent ?? "";
      const level = parseInt(el.tagName.charAt(1), 10);
      if (id && text) {
        extracted.push({ id, text, level });
      }
    });

    setHeadings(extracted);
  }, []);

  // Extract headings after MDX content renders
  useEffect(() => {
    // Small delay to ensure MDX content is mounted
    const timer = setTimeout(extractHeadings, 100);
    return () => clearTimeout(timer);
  }, [extractHeadings]);

  // Re-extract on route changes (content prop removed, so watch URL)
  useEffect(() => {
    extractHeadings();
  }, [extractHeadings, globalThis.location?.pathname]);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className={className ?? "hidden xl:block"} aria-label="Table of contents">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        <h4 className="font-heading mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
          On this page
        </h4>
        <ul className="space-y-1.5 text-sm">
          {headings.map(heading => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                onClick={e => {
                  e.preventDefault();
                  document
                    .getElementById(heading.id)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block border-l-2 py-0.5 pl-3 transition-colors ${activeId === heading.id
                  ? "border-black font-medium text-black"
                  : "border-transparent text-neutral-500 hover:text-black"
                  }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
