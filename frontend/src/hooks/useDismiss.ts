import { useEffect, useRef } from "react";

// Calls `onDismiss` on outside pointerdown or the Escape key, while `active`.
// Returns a ref to attach to the element that should be considered "inside".
export function useDismiss<T extends HTMLElement>(onDismiss: () => void, active = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return undefined;

    function handle(event: PointerEvent | KeyboardEvent) {
      if (event.type === "keydown") {
        if ((event as KeyboardEvent).key === "Escape") onDismiss();
        return;
      }
      if (event.target instanceof Node && !ref.current?.contains(event.target)) onDismiss();
    }

    document.addEventListener("pointerdown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("pointerdown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [onDismiss, active]);

  return ref;
}
