import { useState, useRef, type ReactNode } from "react";

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 border border-neutral-300 bg-white px-2 py-1
                   font-mono text-xs opacity-0 transition-opacity group-hover:opacity-100
                   hover:bg-neutral-100"
        aria-label="Copy code"
        type="button"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
