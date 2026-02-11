import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { useCollections } from "@/hooks/use-docs";

export function DocsLayout() {
  const { collections, loading, error } = useCollections();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border-2 border-foreground p-8 max-w-md">
          <h2 className="font-heading text-xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

   return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <Sidebar
          collections={collections}
          className="hidden md:block border-r border-border-light overflow-y-auto sticky top-14 h-[calc(100vh-3.5rem)]"
        />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet context={{ collections }} />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-light px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
          <span>justworkonit — documentation &amp; learning resources</span>
          <span>built with react + mdx + vite</span>
        </div>
      </footer>

      {/* Mobile nav */}
      <MobileNav collections={collections} />
    </div>
  );
}
