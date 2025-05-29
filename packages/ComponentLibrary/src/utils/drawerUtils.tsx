import type { Menu } from "@workspaceui/etendohookbinder/src/api/types";

export const findActive = (windowId: string | undefined, items: Menu[] | undefined = []): boolean => {
  if (!items || !windowId) return false;
  const stack: Menu[] = [...items];
  while (stack.length > 0) {
    const item = stack.pop();
    if (item) {
      if (item.windowId === windowId) return true;
      if (item.children) stack.push(...item.children);
    }
  }
  return false;
};
