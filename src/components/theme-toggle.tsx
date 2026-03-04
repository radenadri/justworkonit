import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/theme-context";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

const options = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ActiveIcon = options.find((opt) => opt.value === mode)?.icon || Monitor;

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center h-9 w-9 border-2 border-foreground transition-colors duration-100",
          isOpen ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-muted"
        )}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ActiveIcon size={18} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-32 bg-background border-2 border-foreground z-50 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          role="listbox"
        >
          {options.map((option) => {
            const isActive = mode === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMode(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors duration-100 text-left",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-muted"
                )}
                role="option"
                aria-selected={isActive}
              >
                <Icon size={14} strokeWidth={2.5} />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
