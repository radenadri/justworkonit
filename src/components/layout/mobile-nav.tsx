import { useState, useEffect } from "react";
import type { Collection } from "@/types";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

interface MobileNavProps {
  collections: Collection[];
}

export function MobileNav({ collections }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 bg-foreground text-background flex items-center justify-center shadow-none border-2 border-foreground transition-opacity duration-100 hover:opacity-80"
        aria-label="Open navigation"
      >
        <span className="text-lg">☰</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-foreground/20"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r-2 border-foreground overflow-y-auto">
            <div className="flex flex-col gap-3 px-6 py-4 border-b-2 border-foreground">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg font-bold tracking-tight">
                  Navigation
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-100"
                  aria-label="Close navigation"
                >
                  ✕
                </button>
              </div>
              <ThemeToggle className="self-start" />
            </div>
            <Sidebar
              collections={collections}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
