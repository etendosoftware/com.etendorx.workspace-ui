"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type FormMode = "new" | "edit" | "view";
export type TabMode = "table" | "form";

export interface WindowState {
  windowId: string;
  isActive: boolean;
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
    if (key.startsWith("w_")) {
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

    processTabParameter(`s_${windowId}_`, (tabId, value) => {
      selectedRecords[tabId] = value;
    });

    processTabParameter(`tf_${windowId}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], recordId: value };
    });

    processTabParameter(`tm_${windowId}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], mode: value as TabMode };
    });

    processTabParameter(`tfm_${windowId}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], formMode: value as FormMode };
    });
  }

  return { selectedRecords, tabFormStates };
};

const createWindowState = (windowId: string, searchParams: URLSearchParams): WindowState => {
  const isActive = searchParams.get(`w_${windowId}`) === "active";
  const formRecordId = searchParams.get(`r_${windowId}`) || undefined;
  const formMode = (searchParams.get(`fm_${windowId}`) as FormMode) || undefined;

  const { selectedRecords, tabFormStates } = processTabParameters(searchParams, windowId);

  return {
    windowId,
    isActive,
    formRecordId,
    formMode,
    selectedRecords,
    tabFormStates,
  };
};

const setWindowParameters = (params: URLSearchParams, window: WindowState): void => {
  const { windowId, isActive, formRecordId, formMode, selectedRecords, tabFormStates } = window;

  params.set(`w_${windowId}`, isActive ? "active" : "inactive");

  if (formRecordId) {
    params.set(`r_${windowId}`, formRecordId);
  }
  if (formMode) {
    params.set(`fm_${windowId}`, formMode);
  }

  for (const [tabId, selectedRecordId] of Object.entries(selectedRecords)) {
    if (selectedRecordId) {
      params.set(`s_${windowId}_${tabId}`, selectedRecordId);
    }
  }

  for (const [tabId, tabState] of Object.entries(tabFormStates)) {
    if (tabState.recordId) {
      params.set(`tf_${windowId}_${tabId}`, tabState.recordId);
    }
    if (tabState.mode && tabState.mode !== "table") {
      params.set(`tm_${windowId}_${tabId}`, tabState.mode);
    }
    if (tabState.formMode) {
      params.set(`tfm_${windowId}_${tabId}`, tabState.formMode);
    }
  }
};

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { windows, activeWindow, isHomeRoute } = useMemo(() => {
    const windowStates: WindowState[] = [];
    let active: WindowState | undefined;

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const hasWindowParams = Array.from(searchParams.entries()).some(([key]) => key.startsWith("w_"));
    const isHome = currentPath === "/" && !hasWindowParams;

    const windowIds = extractWindowIds(searchParams);

    for (const windowId of windowIds) {
      const windowState = createWindowState(windowId, searchParams);
      windowStates.push(windowState);

      if (windowState.isActive) {
        active = windowState;
      }
    }

    windowStates.sort((a, b) => a.windowId.localeCompare(b.windowId));

    return {
      windows: windowStates,
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
      router.replace(url);
    },
    [router, buildURL]
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
    (windowId: string, title?: string) => {
      const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

      const existingIndex = updatedWindows.findIndex((w) => w.windowId === windowId);

      if (existingIndex >= 0) {
        updatedWindows[existingIndex].isActive = true;
      } else {
        updatedWindows.push({
          windowId,
          isActive: true,
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

      if (updatedWindows.length === 0) {
        router.replace("/");
      } else {
        navigate(updatedWindows);
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
    (windowId: string, tabId: string, recordId: string, mode: TabMode = "form", formMode?: FormMode) => {
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
                formMode: formMode || (recordId === "new" ? "new" : "edit"),
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

  const setRecord = useCallback(
    (windowId: string, recordId: string, tabId?: string) => {
      if (tabId) {
        const formMode: FormMode = recordId === "new" ? "new" : "edit";
        setTabFormState(windowId, tabId, recordId, "form", formMode);
      } else {
        const updatedWindows = windows.map((w) => {
          if (w.windowId === windowId) {
            return {
              ...w,
              formRecordId: recordId,
              formMode: recordId === "new" ? ("new" as const) : ("edit" as const),
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

  return {
    windows,
    activeWindow,
    isHomeRoute,
    openWindow,
    closeWindow,
    setActiveWindow,
    navigateToHome,
    buildURL,

    setSelectedRecord,
    clearSelectedRecord,
    getSelectedRecord,

    setTabFormState,
    clearTabFormState,
    getTabFormState,

    setRecord,
    clearRecord,
  };
}
