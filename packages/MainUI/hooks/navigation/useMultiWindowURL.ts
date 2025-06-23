"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface WindowState {
  windowId: string;
  isActive: boolean;
  formRecordId?: string;
  formMode?: "new" | "edit" | "view";
  selectedRecords: Record<string, string>; // tabId -> recordId
  tabFormStates: Record<
    string,
    {
      recordId?: string;
      mode?: "table" | "form";
      formMode?: "new" | "edit" | "view";
    }
  >;
  title?: string;
}

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { windows, activeWindow, isHomeRoute } = useMemo(() => {
    const windowStates: WindowState[] = [];
    let active: WindowState | undefined;

    // Detectar si estamos en la ruta home - considerar que si hay parámetros de ventana, no estamos realmente en home
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const hasWindowParams = Array.from(searchParams.entries()).some(([key]) => key.startsWith("w_"));
    const isHome = currentPath === "/" && !hasWindowParams;

    console.log("[useMultiWindowURL] Current path:", currentPath);
    console.log("[useMultiWindowURL] Has window params:", hasWindowParams);
    console.log("[useMultiWindowURL] Is home:", isHome);
    console.log("[useMultiWindowURL] Search params:", Array.from(searchParams.entries()));

    const windowIds = new Set<string>();
    for (const [key] of searchParams.entries()) {
      if (key.startsWith("w_")) {
        windowIds.add(key.slice(2));
      }
    }

    console.log("[useMultiWindowURL] Found window IDs:", Array.from(windowIds));

    for (const windowId of windowIds) {
      const isActive = searchParams.get(`w_${windowId}`) === "active";
      console.log(`[useMultiWindowURL] Window ${windowId} active status:`, isActive);

      const formRecordId = searchParams.get(`r_${windowId}`) || undefined;
      const formMode = (searchParams.get(`fm_${windowId}`) as "new" | "edit" | "view") || undefined;

      const selectedRecords: Record<string, string> = {};

      const tabFormStates: Record<
        string,
        {
          recordId?: string;
          mode?: "table" | "form";
          formMode?: "new" | "edit" | "view";
        }
      > = {};

      for (const [key, value] of searchParams.entries()) {
        if (key.startsWith(`s_${windowId}_`) && value) {
          const tabId = key.slice(`s_${windowId}_`.length);
          selectedRecords[tabId] = value;
        }

        if (key.startsWith(`tf_${windowId}_`) && value) {
          const tabId = key.slice(`tf_${windowId}_`.length);
          tabFormStates[tabId] = {
            ...tabFormStates[tabId],
            recordId: value,
          };
        }

        if (key.startsWith(`tm_${windowId}_`) && value) {
          const tabId = key.slice(`tm_${windowId}_`.length);
          tabFormStates[tabId] = {
            ...tabFormStates[tabId],
            mode: value as "table" | "form",
          };
        }

        if (key.startsWith(`tfm_${windowId}_`) && value) {
          const tabId = key.slice(`tfm_${windowId}_`.length);
          tabFormStates[tabId] = {
            ...tabFormStates[tabId],
            formMode: value as "new" | "edit" | "view",
          };
        }
      }

      const windowState: WindowState = {
        windowId,
        isActive,
        formRecordId,
        formMode,
        selectedRecords,
        tabFormStates,
      };

      windowStates.push(windowState);

      if (isActive) {
        active = windowState;
        console.log("[useMultiWindowURL] Setting active window:", windowState);
      }
    }

    windowStates.sort((a, b) => a.windowId.localeCompare(b.windowId));

    console.log("[useMultiWindowURL] Final state:", {
      windows: windowStates,
      activeWindow: active,
      isHomeRoute: isHome,
    });

    return {
      windows: windowStates,
      activeWindow: active,
      isHomeRoute: isHome,
    };
  }, [searchParams]);

  const buildURL = useCallback((newWindows: WindowState[], preserveCurrentPath?: boolean) => {
    const params = new URLSearchParams();

    for (const window of newWindows) {
      const { windowId, isActive, formRecordId, formMode, selectedRecords, tabFormStates } = window;

      // basic state
      params.set(`w_${windowId}`, isActive ? "active" : "inactive");

      if (formRecordId) {
        params.set(`r_${windowId}`, formRecordId);
      }
      if (formMode) {
        params.set(`fm_${windowId}`, formMode);
      }

      // selected state
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
    }

    // Si preserveCurrentPath es true y estamos en home, mantener la ruta "/"
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
    // Mantener las ventanas pero desactivar todas y navegar a home
    const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

    if (updatedWindows.length === 0) {
      // Si no hay ventanas, simplemente ir a home
      router.push("/");
    } else {
      // Si hay ventanas, mantenerlas en la URL pero ir a home
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
    (
      windowId: string,
      tabId: string,
      recordId: string,
      mode: "table" | "form" = "form",
      formMode?: "new" | "edit" | "view"
    ) => {
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
        const formMode = recordId === "new" ? "new" : "edit";
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
