/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  WINDOW_PREFIX,
  ORDER_PREFIX,
  WINDOW_IDENTIFIER_PREFIX,
  FORM_RECORD_ID_PREFIX,
  FORM_MODE_PREFIX,
  TITLE_PREFIX,
  SELECTED_RECORD_PREFIX,
  TAB_FORM_RECORD_ID_PREFIX,
  TAB_MODE_PREFIX,
  TAB_FORM_MODE_PREFIX,
  NEW_RECORD_ID,
  FORM_MODES,
  TAB_MODES,
  TAB_ACTIVE,
  TAB_INACTIVE,
  type FormMode,
  type TabMode,
} from "@/utils/url/constants";

export interface WindowState {
  windowId: string;
  isActive: boolean;
  order: number;
  window_identifier: string;
  formRecordId?: string;
  formMode?: FormMode;
  selectedRecords: Record<string, string>; // tabId -> recordId
  tabFormStates: Record<
    string,
    {
      recordId?: string;
      mode?: TabMode;
      formMode?: FormMode;
    }
  >;
  title?: string;
}

const extractWindowIds = (searchParams: URLSearchParams): Set<string> => {
  const windowIds = new Set<string>();
  for (const [key] of searchParams.entries()) {
    if (key.startsWith(WINDOW_PREFIX)) {
      windowIds.add(key.slice(2));
    }
  }
  return windowIds;
};

const processTabParameters = (
  searchParams: URLSearchParams,
  windowId: string
): {
  selectedRecords: Record<string, string>;
  tabFormStates: Record<string, { recordId?: string; mode?: TabMode; formMode?: FormMode }>;
} => {
  const selectedRecords: Record<string, string> = {};
  const tabFormStates: Record<string, { recordId?: string; mode?: TabMode; formMode?: FormMode }> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!value) continue;

    const processTabParameter = (prefix: string, processor: (tabId: string, value: string) => void) => {
      if (key.startsWith(prefix)) {
        const tabId = key.slice(prefix.length);
        processor(tabId, value);
      }
    };

    processTabParameter(`${SELECTED_RECORD_PREFIX}${windowId}_`, (tabId, value) => {
      selectedRecords[tabId] = value;
    });

    processTabParameter(`${TAB_FORM_RECORD_ID_PREFIX}${windowId}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], recordId: value };
    });

    processTabParameter(`${TAB_MODE_PREFIX}${windowId}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], mode: value as TabMode };
    });

    processTabParameter(`${TAB_FORM_MODE_PREFIX}${windowId}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], formMode: value as FormMode };
    });
  }

  return { selectedRecords, tabFormStates };
};

const createWindowState = (windowId: string, searchParams: URLSearchParams): WindowState => {
  const isActive = searchParams.get(`${WINDOW_PREFIX}${windowId}`) === TAB_ACTIVE;
  const formRecordId = searchParams.get(`${FORM_RECORD_ID_PREFIX}${windowId}`) || undefined;
  const formMode = (searchParams.get(`${FORM_MODE_PREFIX}${windowId}`) as FormMode) || undefined;
  const order = Number.parseInt(searchParams.get(`${ORDER_PREFIX}${windowId}`) || "1", 10);
  const window_identifier = searchParams.get(`${WINDOW_IDENTIFIER_PREFIX}${windowId}`) || windowId;
  const title = searchParams.get(`${TITLE_PREFIX}${windowId}`) || undefined;

  const { selectedRecords, tabFormStates } = processTabParameters(searchParams, windowId);

  return {
    windowId,
    isActive,
    order,
    window_identifier,
    formRecordId,
    formMode,
    selectedRecords,
    tabFormStates,
    title,
  };
};

const setWindowParameters = (params: URLSearchParams, window: WindowState): void => {
  const {
    windowId,
    isActive,
    order,
    window_identifier,
    formRecordId,
    formMode,
    selectedRecords,
    tabFormStates,
    title,
  } = window;

  params.set(`${WINDOW_PREFIX}${windowId}`, isActive ? TAB_ACTIVE : TAB_INACTIVE);
  params.set(`${ORDER_PREFIX}${windowId}`, (order ?? 1).toString());
  params.set(`${WINDOW_IDENTIFIER_PREFIX}${windowId}`, window_identifier);

  if (formRecordId) {
    params.set(`${FORM_RECORD_ID_PREFIX}${windowId}`, formRecordId);
  }
  if (formMode) {
    params.set(`${FORM_MODE_PREFIX}${windowId}`, formMode);
  }
  if (title) {
    params.set(`${TITLE_PREFIX}${windowId}`, title);
  }

  for (const [tabId, selectedRecordId] of Object.entries(selectedRecords)) {
    if (selectedRecordId) {
      params.set(`${SELECTED_RECORD_PREFIX}${windowId}_${tabId}`, selectedRecordId);
    }
  }

  for (const [tabId, tabState] of Object.entries(tabFormStates)) {
    if (tabState.recordId) {
      params.set(`${TAB_FORM_RECORD_ID_PREFIX}${windowId}_${tabId}`, tabState.recordId);
    }
    if (tabState.mode && tabState.mode !== TAB_MODES.TABLE) {
      params.set(`${TAB_MODE_PREFIX}${windowId}_${tabId}`, tabState.mode);
    }
    if (tabState.formMode) {
      params.set(`${TAB_FORM_MODE_PREFIX}${windowId}_${tabId}`, tabState.formMode);
    }
  }
};

const getNextOrder = (windows: WindowState[]): number => {
  if (windows.length === 0) return 1;
  const orders = windows.map((w) => w.order || 1);
  return Math.max(...orders) + 1;
};

const normalizeWindowOrders = (windows: WindowState[]): WindowState[] => {
  return [...windows]
    .sort((a, b) => (a.order || 1) - (b.order || 1))
    .map((window, index) => ({
      ...window,
      order: index + 1,
    }));
};

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { windows, activeWindow, isHomeRoute } = useMemo(() => {
    const windowStates: WindowState[] = [];
    let active: WindowState | undefined;

    const hasWindowActiveParams = Array.from(searchParams.entries()).some(
      ([key, value]) => key.startsWith(WINDOW_PREFIX) && value === TAB_ACTIVE
    );
    const isHome = !hasWindowActiveParams;

    const windowIds = extractWindowIds(searchParams);

    for (const windowId of windowIds) {
      const windowState = createWindowState(windowId, searchParams);
      windowStates.push(windowState);

      if (windowState.isActive) {
        active = windowState;
      }
    }

    const orderedStates = [...windowStates].sort((a, b) => a.order - b.order);

    return {
      windows: orderedStates,
      activeWindow: active,
      isHomeRoute: isHome,
    };
  }, [searchParams]);

  const buildURL = useCallback((newWindows: WindowState[], preserveCurrentPath?: boolean) => {
    const params = new URLSearchParams();

    for (const window of newWindows) {
      setWindowParameters(params, window);
    }

    if (preserveCurrentPath && window.location.pathname === "/") {
      return `/?${params.toString()}`;
    }

    return `/window?${params.toString()}`;
  }, []);

  const navigate = useCallback(
    (newWindows: WindowState[], preserveCurrentPath?: boolean) => {
      const url = buildURL(newWindows, preserveCurrentPath);
      try {
        const current = searchParams?.toString?.() ?? "";
        const next = url.split("?")[1] || "";
        if (current === next) {
          // Avoid redundant replace when URL params are identical
          return;
        }
      } catch {
        // best-effort guard; if any error, proceed with replace
      }
      router.replace(url);
    },
    [router, buildURL, searchParams]
  );

  const navigateToHome = useCallback(() => {
    const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

    if (updatedWindows.length === 0) {
      router.push("/");
    } else {
      const url = `/?${buildURL(updatedWindows).split("?")[1]}`;
      router.push(url);
    }
  }, [windows, buildURL, router]);

  const openWindow = useCallback(
    (windowId: string, title?: string, window_identifier?: string) => {
      const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

      const existingIndex = updatedWindows.findIndex((w) => w.windowId === windowId);

      if (existingIndex >= 0) {
        updatedWindows[existingIndex].isActive = true;
        if (title) {
          updatedWindows[existingIndex].title = title;
        }
        if (window_identifier) {
          updatedWindows[existingIndex].window_identifier = window_identifier;
        }
      } else {
        const nextOrder = getNextOrder(updatedWindows);
        updatedWindows.push({
          windowId,
          isActive: true,
          order: nextOrder,
          window_identifier: window_identifier || windowId,
          title,
          selectedRecords: {},
          tabFormStates: {},
        });
      }

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const closeWindow = useCallback(
    (windowId: string) => {
      const updatedWindows = windows.filter((w) => w.windowId !== windowId);

      const wasActive = windows.find((w) => w.windowId === windowId)?.isActive;
      if (wasActive && updatedWindows.length > 0) {
        updatedWindows[0].isActive = true;
      }

      const normalizedWindows = normalizeWindowOrders(updatedWindows);

      if (normalizedWindows.length === 0) {
        router.replace("/");
      } else {
        navigate(normalizedWindows);
      }
    },
    [windows, navigate, router]
  );

  const setActiveWindow = useCallback(
    (windowId: string) => {
      const updatedWindows = windows.map((w) => ({
        ...w,
        isActive: w.windowId === windowId,
      }));

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const updateWindowTitle = useCallback(
    (windowId: string, title: string) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          return {
            ...w,
            title,
          };
        }
        return w;
      });

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const setSelectedRecord = useCallback(
    (windowId: string, tabId: string, recordId: string) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          return {
            ...w,
            selectedRecords: {
              ...w.selectedRecords,
              [tabId]: recordId,
            },
          };
        }
        return w;
      });

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const clearSelectedRecord = useCallback(
    (windowId: string, tabId: string) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          const newSelectedRecords = { ...w.selectedRecords };
          delete newSelectedRecords[tabId];

          return {
            ...w,
            selectedRecords: newSelectedRecords,
          };
        }
        return w;
      });

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const getSelectedRecord = useCallback(
    (windowId: string, tabId: string): string | undefined => {
      const window = windows.find((w) => w.windowId === windowId);
      return window?.selectedRecords[tabId];
    },
    [windows]
  );

  const setTabFormState = useCallback(
    (windowId: string, tabId: string, recordId: string, mode: TabMode = TAB_MODES.FORM, formMode?: FormMode) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          const currentTabState = w.tabFormStates[tabId] || {};

          return {
            ...w,
            tabFormStates: {
              ...w.tabFormStates,
              [tabId]: {
                ...currentTabState,
                recordId,
                mode,
                formMode: formMode || (recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT),
              },
            },
          };
        }
        return w;
      });

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const clearTabFormState = useCallback(
    (windowId: string, tabId: string) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          const newTabFormStates = { ...w.tabFormStates };
          delete newTabFormStates[tabId];

          return {
            ...w,
            tabFormStates: newTabFormStates,
          };
        }
        return w;
      });

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  const getTabFormState = useCallback(
    (windowId: string, tabId: string) => {
      const window = windows.find((w) => w.windowId === windowId);
      return window?.tabFormStates[tabId];
    },
    [windows]
  );

  // Batch operations
  const applyWindowUpdates = useCallback(
    (transform: (windows: WindowState[]) => WindowState[], preserveCurrentPath?: boolean) => {
      const nextWindows = transform(windows);
      navigate(nextWindows, preserveCurrentPath);
    },
    [windows, navigate]
  );

  const clearChildrenSelections = useCallback(
    (windowId: string, childTabIds: string[]) => {
      applyWindowUpdates((prev) =>
        prev.map((w) => {
          if (w.windowId !== windowId) return w;
          const newSelected = { ...w.selectedRecords };
          const newTabStates = { ...w.tabFormStates } as Record<
            string,
            { recordId?: string; mode?: TabMode; formMode?: FormMode }
          >;
          for (const tabId of childTabIds) {
            delete newSelected[tabId];
            delete newTabStates[tabId];
          }
          return { ...w, selectedRecords: newSelected, tabFormStates: newTabStates };
        })
      );
    },
    [applyWindowUpdates]
  );

  const openWindowAndSelect = useCallback(
    (
      windowId: string,
      options?: {
        title?: string;
        window_identifier?: string;
        selection?: { tabId: string; recordId: string; openForm?: boolean; formMode?: FormMode };
      }
    ) => {
      applyWindowUpdates((prev) => {
        const updated = prev.map((w) => ({ ...w, isActive: false }));
        const existingIndex = updated.findIndex((w) => w.windowId === windowId);

        let target: WindowState;
        if (existingIndex >= 0) {
          const current = updated[existingIndex];
          target = {
            ...current,
            isActive: true,
            title: options?.title ?? current.title,
            window_identifier: options?.window_identifier ?? current.window_identifier,
          };
          updated[existingIndex] = target;
        } else {
          const nextOrder = getNextOrder(updated);
          target = {
            windowId,
            isActive: true,
            order: nextOrder,
            window_identifier: options?.window_identifier || windowId,
            title: options?.title,
            selectedRecords: {},
            tabFormStates: {},
          };
          updated.push(target);
        }

        if (options?.selection) {
          const { tabId, recordId, openForm, formMode } = options.selection;
          target.selectedRecords = { ...target.selectedRecords, [tabId]: recordId };
          if (openForm) {
            target.tabFormStates = {
              ...target.tabFormStates,
              [tabId]: { recordId, mode: TAB_MODES.FORM, formMode: formMode || FORM_MODES.EDIT },
            };
          }
        }
        return updated;
      });
    },
    [applyWindowUpdates]
  );

  const setRecord = useCallback(
    (windowId: string, recordId: string, tabId?: string) => {
      if (tabId) {
        const formMode: FormMode = recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT;
        setTabFormState(windowId, tabId, recordId, TAB_MODES.FORM, formMode);
      } else {
        const updatedWindows = windows.map((w) => {
          if (w.windowId === windowId) {
            return {
              ...w,
              formRecordId: recordId,
              formMode: recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT,
            };
          }
          return w;
        });
        navigate(updatedWindows);
      }
    },
    [windows, navigate, setTabFormState]
  );

  const clearRecord = useCallback(
    (windowId: string, tabId?: string) => {
      if (tabId) {
        clearTabFormState(windowId, tabId);
      } else {
        const updatedWindows = windows.map((w) => {
          if (w.windowId === windowId) {
            const { formMode, formRecordId, ...rest } = w;
            return rest;
          }
          return w;
        });
        navigate(updatedWindows);
      }
    },
    [windows, navigate, clearTabFormState]
  );

  const reorderWindows = useCallback(
    (windowId: string, newOrder: number) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          return { ...w, order: newOrder };
        }
        return w;
      });

      const normalizedWindows = normalizeWindowOrders(updatedWindows);
      navigate(normalizedWindows);
    },
    [windows, navigate]
  );

  return {
    windows,
    activeWindow,
    isHomeRoute,
    openWindow,
    closeWindow,
    setActiveWindow,
    navigateToHome,
    buildURL,
    updateWindowTitle,

    setSelectedRecord,
    clearSelectedRecord,
    getSelectedRecord,

    setTabFormState,
    clearTabFormState,
    getTabFormState,

    setRecord,
    clearRecord,

    reorderWindows,
    getNextOrder,

    // batching helpers
    applyWindowUpdates,
    clearChildrenSelections,
    openWindowAndSelect,
  };
}
