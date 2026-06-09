import { useCallback, useMemo, type SetStateAction } from "react";
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";

export function useExpandedMenuItems(roleId: string) {
  const [storage, setStorage] = useLocalStorage<Record<string, string[]>>("menuExpandedItems", {});

  const expandedItems = useMemo(() => new Set(storage[roleId] ?? []), [storage, roleId]);

  const setExpandedItems = useCallback(
    (action: SetStateAction<Set<string>>) => {
      setStorage((prev) => {
        const current = new Set(prev[roleId] ?? []);
        const next = typeof action === "function" ? action(current) : action;
        return { ...prev, [roleId]: Array.from(next) };
      });
    },
    [roleId, setStorage]
  );

  return { expandedItems, setExpandedItems };
}
