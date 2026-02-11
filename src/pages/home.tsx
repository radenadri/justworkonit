import { Link, useOutletContext } from "react-router-dom";
import type { Collection } from "@/types";

export function HomePage() {
  const { collections } = useOutletContext<{ collections: Collection[] }>();

  return (
    <div className="px-6 md:px-12 py-12 md:py-20 max-w-4xl">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="font-heading text-5xl md:text-7xl tracking-tighter leading-none mb-4">
          justworkonit
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
          Documentation &amp; Learning Resources
        </p>
        <p className="text-lg text-muted-foreground max-w-xl font-body">
          Technical references, implementation guides, and study notes. Select a collection to
          begin.
        </p>
      </div>

      {/* Collections grid */}
      <div className="space-y-6">
        {collections.map((col) => (
          <Link
            key={col.name}
            to={`/${col.name}/${col.docs[0]?.slug ?? ""}`}
            className="block border-2 border-foreground p-6 transition-colors duration-100 hover:bg-foreground hover:text-background group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">{col.label}</h2>
                <p className="text-sm text-muted-foreground group-hover:text-background/70 mt-1 font-mono">
                  {col.docs.length} {col.docs.length === 1 ? "document" : "documents"}
                </p>
              </div>
              <span className="text-2xl transition-transform duration-100 group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
