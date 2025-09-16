import { type RefObject, useRef } from "react";

export function useInputRefs(
  count: number,
): RefObject<HTMLInputElement | null>[] {
  const refs = useRef<RefObject<HTMLInputElement | null>[]>([]);

  // Initialize refs array if not already done or if count changed
  if (refs.current.length !== count) {
    refs.current = Array.from({ length: count }, () => ({ current: null }));
  }

  return refs.current;
}
