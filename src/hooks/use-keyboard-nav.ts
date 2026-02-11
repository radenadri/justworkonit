import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardNav(
  prevPath: string | null,
  nextPath: string | null,
) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && prevPath) {
        navigate(prevPath);
      } else if (e.key === "ArrowRight" && nextPath) {
        navigate(nextPath);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevPath, nextPath, navigate]);
}
