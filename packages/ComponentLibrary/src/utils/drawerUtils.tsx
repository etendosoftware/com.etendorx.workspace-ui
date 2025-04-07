import { Menu } from '@workspaceui/etendohookbinder/src/api/types';

export const findActive = (windowId: string | undefined, items: Menu[] | undefined = []): boolean => {
  if (!windowId || !items.length) return false;

  const stack: Menu[] = items;
  for (let i = 0; i < stack.length; i++) {
    const item = stack[i];
    if (item.windowId === windowId) return true;

    if (item.children) {
      stack.push(...item.children);
    }
  }

  return false;
};
