"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface WindowState {
  windowId: string;
  isActive: boolean;
  // ✅ CAMBIO: Estado de formulario global para la ventana
  formRecordId?: string;
  formMode?: "new" | "edit" | "view";
  // ✅ CAMBIO: Estados de selección por tab (independientes)
  selectedRecords: Record<string, string>; // tabId -> recordId
  // ✅ CAMBIO: Estados de formulario por tab (independientes)
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

  const { windows, activeWindow } = useMemo(() => {
    const windowStates: WindowState[] = [];
    let active: WindowState | undefined;

    // ✅ Identificar todas las ventanas
    const windowIds = new Set<string>();
    for (const [key] of searchParams.entries()) {
      if (key.startsWith("w_")) {
        windowIds.add(key.slice(2));
      }
    }

    // ✅ Para cada ventana, construir su estado completo
    windowIds.forEach((windowId) => {
      const isActive = searchParams.get(`w_${windowId}`) === "active";

      // ✅ Estado global de formulario de ventana (OBSOLETO - mantener para compatibilidad)
      const formRecordId = searchParams.get(`r_${windowId}`) || undefined;
      const formMode = (searchParams.get(`fm_${windowId}`) as "new" | "edit" | "view") || undefined;

      // ✅ Estados de selección por tab
      const selectedRecords: Record<string, string> = {};

      // ✅ Estados de formulario por tab (NUEVO)
      const tabFormStates: Record<
        string,
        {
          recordId?: string;
          mode?: "table" | "form";
          formMode?: "new" | "edit" | "view";
        }
      > = {};

      // ✅ Recopilar todos los estados específicos de tabs
      for (const [key, value] of searchParams.entries()) {
        // Estados de selección: s_windowId_tabId
        if (key.startsWith(`s_${windowId}_`) && value) {
          const tabId = key.slice(`s_${windowId}_`.length);
          selectedRecords[tabId] = value;
        }

        // ✅ NUEVO: Estados de formulario por tab: tf_windowId_tabId
        if (key.startsWith(`tf_${windowId}_`) && value) {
          const tabId = key.slice(`tf_${windowId}_`.length);
          tabFormStates[tabId] = {
            ...tabFormStates[tabId],
            recordId: value,
          };
        }

        // ✅ NUEVO: Modo de tab: tm_windowId_tabId
        if (key.startsWith(`tm_${windowId}_`) && value) {
          const tabId = key.slice(`tm_${windowId}_`.length);
          tabFormStates[tabId] = {
            ...tabFormStates[tabId],
            mode: value as "table" | "form",
          };
        }

        // ✅ NUEVO: Modo de formulario de tab: tfm_windowId_tabId
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
        formRecordId, // Mantener para compatibilidad
        formMode, // Mantener para compatibilidad
        selectedRecords,
        tabFormStates, // ✅ NUEVO
      };

      windowStates.push(windowState);

      if (isActive) {
        active = windowState;
      }
    });

    windowStates.sort((a, b) => a.windowId.localeCompare(b.windowId));
    return { windows: windowStates, activeWindow: active };
  }, [searchParams]);

  const buildURL = useCallback((newWindows: WindowState[]) => {
    const params = new URLSearchParams();

    newWindows.forEach((window) => {
      const { windowId, isActive, formRecordId, formMode, selectedRecords, tabFormStates } = window;

      // Estado básico de ventana
      params.set(`w_${windowId}`, isActive ? "active" : "inactive");

      // ✅ Estado global de formulario (mantener para compatibilidad)
      if (formRecordId) {
        params.set(`r_${windowId}`, formRecordId);
      }
      if (formMode) {
        params.set(`fm_${windowId}`, formMode);
      }

      // ✅ Estados de selección por tab
      Object.entries(selectedRecords).forEach(([tabId, selectedRecordId]) => {
        if (selectedRecordId) {
          params.set(`s_${windowId}_${tabId}`, selectedRecordId);
        }
      });

      // ✅ NUEVO: Estados de formulario por tab
      Object.entries(tabFormStates).forEach(([tabId, tabState]) => {
        if (tabState.recordId) {
          params.set(`tf_${windowId}_${tabId}`, tabState.recordId);
        }
        if (tabState.mode && tabState.mode !== "table") {
          params.set(`tm_${windowId}_${tabId}`, tabState.mode);
        }
        if (tabState.formMode) {
          params.set(`tfm_${windowId}_${tabId}`, tabState.formMode);
        }
      });
    });

    return `/window?${params.toString()}`;
  }, []);

  const navigate = useCallback(
    (newWindows: WindowState[]) => {
      const url = buildURL(newWindows);
      console.log("Navigating to:", url);
      router.replace(url);
    },
    [router, buildURL]
  );

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
          tabFormStates: {}, // ✅ NUEVO
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

  // ✅ FUNCIONES PARA MANEJO DE SELECCIÓN (sin cambios)
  const setSelectedRecord = useCallback(
    (windowId: string, tabId: string, recordId: string) => {
      console.log(`Setting selected record: window=${windowId}, tab=${tabId}, record=${recordId}`);

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
      console.log(`Clearing selected record: window=${windowId}, tab=${tabId}`);

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

  // ✅ NUEVAS FUNCIONES PARA MANEJO DE FORMULARIO POR TAB
  const setTabFormState = useCallback(
    (
      windowId: string,
      tabId: string,
      recordId: string,
      mode: "table" | "form" = "form",
      formMode?: "new" | "edit" | "view"
    ) => {
      console.log(`Setting tab form state: window=${windowId}, tab=${tabId}, record=${recordId}, mode=${mode}`);

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
      console.log(`Clearing tab form state: window=${windowId}, tab=${tabId}`);

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

  // ✅ FUNCIONES LEGACY PARA COMPATIBILIDAD (ahora usan el tab principal)
  const setRecord = useCallback(
    (windowId: string, recordId: string, tabId?: string) => {
      // Si no se especifica tabId, usar el primer tab o comportamiento legacy
      if (tabId) {
        const formMode = recordId === "new" ? "new" : "edit";
        setTabFormState(windowId, tabId, recordId, "form", formMode);
      } else {
        // Comportamiento legacy para compatibilidad
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
        // Comportamiento legacy
        const updatedWindows = windows.map((w) => {
          if (w.windowId === windowId) {
            const updated = { ...w };
            delete updated.formMode;
            delete updated.formRecordId;
            return updated;
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
    openWindow,
    closeWindow,
    setActiveWindow,

    // ✅ Funciones de selección (sin cambios)
    setSelectedRecord,
    clearSelectedRecord,
    getSelectedRecord,

    // ✅ NUEVAS funciones específicas por tab
    setTabFormState,
    clearTabFormState,
    getTabFormState,

    // ✅ Funciones legacy (mantenidas para compatibilidad)
    setRecord,
    clearRecord,
  };
}
