import { NavLink, useParams } from "react-router-dom";
import type { Collection } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  collections: Collection[];
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ collections, className, onNavigate }: SidebarProps) {
  const { collection: activeCollection } = useParams();

  return (
    <aside className={cn("w-64 shrink-0", className)}>
      <nav className="py-6 pr-4 space-y-6">
        {collections.map(col => (
          <CollectionSection
            key={col.name}
            collection={col}
            isActive={col.name === activeCollection}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function CollectionSection({
  collection,
  isActive,
  onNavigate,
}: {
  collection: Collection;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-widest transition-colors duration-100",
          isActive
            ? "text-foreground font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>{collection.label}</span>
        <span className="text-[10px]">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5 pl-3 border-l-2 border-border-light ml-3">
          {collection.docs.map(doc => (
            <li key={doc.slug}>
              <NavLink
                to={`/${collection.name}/${doc.slug}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "block px-3 py-1.5 text-sm transition-colors duration-100",
                    isActive
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                {doc.title}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
