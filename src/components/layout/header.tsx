import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between h-14 px-6">
        <Link to="/" className="flex items-center gap-3 transition-opacity duration-100 hover:opacity-70">
          <div className="h-8 w-8 bg-foreground flex items-center justify-center">
            <span className="text-background font-heading font-bold text-lg">D</span>
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">
            Docs
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-100 hover:text-foreground"
          >
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
