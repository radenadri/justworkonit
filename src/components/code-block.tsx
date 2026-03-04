import {
  useState,
  useRef,
  isValidElement,
  Children,
  type ReactNode,
  type ReactElement,
} from "react";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  // If the child <code> is a mermaid block, CodeRouter will return <MermaidDiagram>.
  // We must NOT wrap it in <pre> — just pass through so the diagram renders freely.
  if (isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    if (child.props?.className === "language-mermaid") {
      return <>{children}</>;
    }
  }

  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract code and language from children
  // MDX usually passes a <code> element as the only child of <pre>
  const child = Children.only(children) as ReactElement<{
    className?: string;
    children?: ReactNode;
  }>;
  const language = child.props.className?.replace("language-", "") || "text";
  const code = String(child.props.children ?? "").replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom theme overrides to match the site's monochrome aesthetic
  const customStyle = {
    ...oneLight,
    'pre[class*="language-"]': {
      ...oneLight['pre[class*="language-"]'],
      background: "transparent",
      margin: 0,
      padding: "1.5rem",
      fontSize: "0.875rem",
      lineHeight: "1.7",
      border: "none",
    },
    'code[class*="language-"]': {
      ...oneLight['code[class*="language-"]'],
      background: "transparent",
      fontFamily: 'var(--font-mono)',
      border: "none",
      padding: 0,
    }
  };

  return (
    <div className="group relative my-6 bg-muted/30" ref={containerRef}>
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        PreTag="div"
        CodeTag="div"
        useInlineStyles={true}
      >
        {code}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 border border-neutral-300 bg-white px-2 py-1
                   font-mono text-[10px] uppercase tracking-wider opacity-0 transition-opacity 
                   group-hover:opacity-100 hover:bg-neutral-100 cursor-pointer"
        aria-label="Copy code"
        type="button"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <div className="absolute bottom-3 right-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {language}
      </div>
    </div>
  );
}
