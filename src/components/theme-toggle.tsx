import { useTheme } from "@/components/theme-context";
import { cn } from "@/lib/utils";

const options = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={cn("flex items-center border-2 border-foreground", className)}>
      {options.map((option, index) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setMode(option.value)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors duration-100",
              index !== 0 && "border-l-2 border-foreground",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
