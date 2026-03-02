import {
  type ComponentType,
  type ReactNode,
  Children,
  isValidElement,
} from "react";
import { MDXProvider } from "@mdx-js/react";
import { CodeBlock } from "@/components/code-block";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { CheckboxTracker } from "@/components/checkbox-tracker";

// Code element router — detect mermaid blocks, otherwise render normal code
function CodeRouter({
  className,
  children,
  ...props
}: React.ComponentProps<"code">) {
  if (className === "language-mermaid") {
    // In MDX, `children` for fenced code blocks can be an array.
    // - `String(children)` stringifies arrays with commas -> corrupts Mermaid.
    // - In some cases, the array parts split on line boundaries, but without preserving
    //   a newline at the boundary; naive joining can collapse two statements onto one line.
    const parts = Children.toArray(children)
      .map(part => (typeof part === "string" || typeof part === "number" ? String(part) : ""))
      .filter(Boolean);

    const code = parts
      .reduce((acc, seg) => {
        if (!acc) return seg;
        const accEndsWithNewline = acc.endsWith("\n");
        const segStartsWithNewline = seg.startsWith("\n");
        return accEndsWithNewline || segStartsWithNewline ? acc + seg : acc + "\n" + seg;
      }, "")
      .replace(/\r\n/g, "\n")
      .trim();

    return <MermaidDiagram code={code} />;
  }
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

// Task list item — intercept GFM checkboxes and make them interactive
function TaskListItem({
  children,
  ...props
}: React.ComponentProps<"li">) {
  const childArray = Children.toArray(children);
  const firstChild = childArray[0];

  // Detect GFM task list: first child is <input type="checkbox">
  if (
    isValidElement(firstChild) &&
    (firstChild as React.ReactElement<{ type?: string }>).props?.type === "checkbox"
  ) {
    const checkboxProps = (firstChild as React.ReactElement<{ checked?: boolean }>).props;
    const rest = childArray.slice(1);

    return (
      <li {...props} className="list-none">
        <CheckboxTracker defaultChecked={checkboxProps.checked ?? false}>
          {rest}
        </CheckboxTracker>
      </li>
    );
  }

  return <li {...props}>{children}</li>;
}

// MDX component overrides — registered globally via MDXProvider
const mdxComponents = {
  pre: CodeBlock,
  code: CodeRouter,
  li: TaskListItem,
};

interface MdxRendererProps {
  Content: ComponentType;
}

export function MdxRenderer({ Content }: MdxRendererProps) {
  return (
    <MDXProvider components={mdxComponents}>
      <article className="prose prose-lg max-w-none">
        <Content />
      </article>
    </MDXProvider>
  );
}
