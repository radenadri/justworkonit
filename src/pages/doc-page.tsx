import { useParams, Link, useOutletContext } from "react-router-dom";
import { useDoc } from "@/hooks/use-docs";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import { MdxRenderer } from "@/components/mdx-renderer";
import { ProgressProvider } from "@/components/progress-context";
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
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-10 animate-entrance stagger-1">
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
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-8 animate-entrance stagger-2">
          {doc.title}
        </h1>

        <div className="h-1 bg-foreground mb-12 animate-entrance stagger-2" />

        {/* MDX content */}
        <div className="animate-entrance stagger-3">
          <ProgressProvider docKey={`${collection}/${slug}`}>
            <MdxRenderer Content={doc.Content} />
          </ProgressProvider>
        </div>

        {/* Prev / Next navigation */}
        <div className="mt-24 pt-12 border-t-2 border-foreground animate-entrance stagger-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {prevDoc ? (
              <Link
                to={prevPath!}
                className="group flex flex-col border-2 border-foreground p-6 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  ← Previous
                </div>
                <div className="font-heading text-lg font-bold truncate">{prevDoc.title}</div>
              </Link>
            ) : (
              <div />
            )}

            {nextDoc ? (
              <Link
                to={nextPath!}
                className="group flex flex-col border-2 border-foreground p-6 text-right transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Next →
                </div>
                <div className="font-heading text-lg font-bold truncate">{nextDoc.title}</div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </article>

      {/* Table of Contents (desktop only) */}
      <TableOfContents
        className="hidden lg:block border-l border-border-light"
      />
    </div>
  );
}
