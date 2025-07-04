import { useEffect } from "react";

/**
 * Hook to detect clicks outside of a specified element.
 * Calls the provided handler when a click happens outside the referenced element.
 *
 * @param {React.RefObject<HTMLElement>} ref - React ref object pointing to the element.
 * @param {(event: MouseEvent) => void} handler - Callback function to run on outside click.
 */
export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const target = event.target as Node;
      // Ignore if click is inside the ref element or if ref contains the focused element
      if (!ref.current || ref.current.contains(target)) return;
      if (ref.current.contains(document.activeElement)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

/**
 * Hook to detect when the Escape key is pressed.
 * Calls the provided handler when the Escape key is detected.
 *
 * @param {(event: KeyboardEvent) => void} handler - Callback function to run on Escape key press.
 */
export function useEscapeKey(handler: (event: KeyboardEvent) => void) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Esc") {
        handler(event);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handler]);
}

/**
 * Hook to execute a handler function whenever the window is resized.
 *
 * @param {() => void} handler - Callback function to run on window resize.
 */
export function useWindowResize(handler: () => void) {
  useEffect(() => {
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [handler]);
}
