import { useEffect, useState } from "react";

// Lazy-load mermaid to avoid ~1MB in initial bundle
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(m => {
      // Mermaid's ESM/CJS interop varies by bundler/runtime.
      // Normalize to an object that has initialize/render.
      const mermaid: any = (m as any).default ?? m;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#ffffff",
          primaryBorderColor: "#000000",
          primaryTextColor: "#000000",
          lineColor: "#000000",
          secondaryColor: "#f5f5f5",
          tertiaryColor: "#e5e5e5",
          noteBkgColor: "#f5f5f5",
          noteTextColor: "#000000",
          noteBorderColor: "#000000",
          fontFamily: '"Google Sans", "Segoe UI", Roboto, sans-serif',
        },
      });
      return m;
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadMermaid().then(async m => {
      if (cancelled) return;
      try {
        const mermaid: any = (m as any).default ?? m;
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Mermaid render error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="border border-neutral-300 bg-neutral-50 p-4 text-sm">
        <pre className="whitespace-pre-wrap">
          <code>Mermaid error: {error}</code>
        </pre>

        <details className="mt-3">
          <summary className="cursor-pointer select-none">Raw diagram source</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap border border-neutral-200 bg-white p-3">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      className="my-6 flex justify-center border border-neutral-200 bg-white p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
