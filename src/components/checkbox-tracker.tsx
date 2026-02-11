import { useCheckboxStorage } from "@/hooks/use-checkbox-storage";
import { useProgress } from "@/components/progress-context";
import type { ReactNode } from "react";

interface CheckboxTrackerProps {
  defaultChecked: boolean;
  children?: ReactNode;
}

export function CheckboxTracker({
  defaultChecked,
  children,
}: CheckboxTrackerProps) {
  const { docKey, getNextIndex } = useProgress();
  const index = getNextIndex();
  const storageKey = `checkbox:${docKey}:${index}`;
  const [isChecked, setChecked] = useCheckboxStorage(
    storageKey,
    defaultChecked,
  );

  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => setChecked(!isChecked)}
        className="mt-1.5 h-4 w-4 cursor-pointer accent-black"
      />
      <span className={isChecked ? "line-through opacity-60" : ""}>
        {children}
      </span>
    </label>
  );
}
