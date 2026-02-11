import { useParams, Link, useOutletContext } from "react-router-dom";
import { useDoc } from "@/hooks/use-docs";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TableOfContents } from "@/components/table-of-contents";
import type { Collection } from "@/types";

export function DocPage() {
  const { collection, slug } = useParams<{ collection: string; slug: string }>();
  const { doc, loading, error } = useDoc(collection, slug);
  const { collections } = useOutletContext<{ collections: Collection[] }>();

  // Compute prev/next BEFORE any early returns (Rules of Hooks)
  const currentCollection = collections.find(c => c.name === collection);
  const currentIndex = currentCollection?.docs.findIndex(d => d.slug === slug) ?? -1;
  const prevDoc = currentIndex > 0 ? currentCollection?.docs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < (currentCollection?.docs.length ?? 0) - 1
    ? currentCollection?.docs[currentIndex + 1]
    : null;

  const prevPath = prevDoc ? `/${collection}/${prevDoc.slug}` : null;
  const nextPath = nextDoc ? `/${collection}/${nextDoc.slug}` : null;
  useKeyboardNav(prevPath, nextPath);

  if (loading) {
    return (
      <div className="px-6 md:px-12 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted w-2/3" />
          <div className="h-4 bg-muted w-full" />
          <div className="h-4 bg-muted w-5/6" />
          <div className="h-4 bg-muted w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="px-6 md:px-12 py-12">
        <div className="border-2 border-foreground p-8">
          <h2 className="font-heading text-xl font-bold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-4">
            {error ?? "The requested document could not be loaded."}
          </p>
          <Link
            to="/"
            className="inline-block bg-foreground text-background px-6 py-2 text-xs font-mono uppercase tracking-widest transition-opacity duration-100 hover:opacity-80"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Content */}
      <article className="flex-1 min-w-0 px-6 md:px-12 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
          <Link to="/" className="transition-colors duration-100 hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link
            to={`/${collection}/${currentCollection?.docs[0]?.slug ?? ""}`}
            className="transition-colors duration-100 hover:text-foreground"
          >
            {currentCollection?.label}
          </Link>
          <span>/</span>
          <span className="text-foreground">{doc.title}</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-8">
          {doc.title}
        </h1>

        <div className="h-0.5 bg-foreground mb-8" />

        {/* Markdown content */}
        <MarkdownRenderer content={doc.content} />

        {/* Prev / Next navigation */}
        <div className="mt-16 pt-8 border-t-2 border-foreground">
          <div className="flex justify-between gap-4">
            {prevDoc ? (
              <Link
                to={prevPath!}
                className="group flex-1 border-2 border-foreground p-4 transition-colors duration-100 hover:bg-foreground hover:text-background"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground group-hover:text-background/70 mb-1">
                  ← Previous
                </div>
                <div className="font-heading font-bold truncate">{prevDoc.title}</div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextDoc ? (
              <Link
                to={nextPath!}
                className="group flex-1 border-2 border-foreground p-4 text-right transition-colors duration-100 hover:bg-foreground hover:text-background"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground group-hover:text-background/70 mb-1">
                  Next →
                </div>
                <div className="font-heading font-bold truncate">{nextDoc.title}</div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </article>

      {/* Table of Contents (desktop only) */}
      <TableOfContents
        content={doc.content}
        className="hidden lg:block border-l border-border-light"
      />
    </div>
  );
}
