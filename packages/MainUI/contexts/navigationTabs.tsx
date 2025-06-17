"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryParams } from "@/hooks/useQueryParams";
import type { Menu } from "@workspaceui/etendohookbinder/src/api/types";

// Tipos para el sistema de navegación por tabs
export interface NavigationTab {
  id: string;
  title: string;
  windowId?: string;
  recordId?: string;
  icon?: string;
  url: string;
  type: "home" | "window" | "process" | "report";
  isActive: boolean;
  canClose: boolean;
  metadata?: {
    entityName?: string;
    tabId?: string;
    mode?: "table" | "form";
    // Estado memoizado de la ventana
    windowState?: {
      selectedRecordId?: string;
      formData?: Record<string, any>;
      tableState?: {
        page: number;
        sortBy: string;
        filters: Record<string, any>;
      };
      scrollPosition?: number;
    };
  };
  // Timestamp para saber cuándo fue la última vez activa
  lastActive: number;
}

export interface NavigationTabsContextType {
  tabs: NavigationTab[];
  activeTabId: string;
  addOrActivateTab: (url: string, windowId?: string, recordId?: string) => void;
  closeTab: (tabId: string) => void;
  switchToTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  updateTabMetadata: (tabId: string, metadata: Partial<NavigationTab["metadata"]>) => void;
  updateTabState: (tabId: string, state: Partial<NavigationTab["metadata"]["windowState"]>) => void;
  getTabById: (tabId: string) => NavigationTab | undefined;
  getActiveTab: () => NavigationTab | undefined;
  navigateFromMenu: (menuItem: Menu) => void;
  isReady: boolean; // Nuevo: indica si el router está listo
}

const NavigationTabsContext = createContext<NavigationTabsContextType>({} as NavigationTabsContextType);

const HOME_TAB_ID = "home";
const MAX_TABS = 10;

export function NavigationTabsProvider({ children }: React.PropsWithChildren) {
  // Estado para manejar cuando el router está listo
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Hooks de Next.js con manejo de errores
  let router: ReturnType<typeof useRouter> | null = null;
  let pathname = "/";
  let windowId: string | undefined;
  let recordId: string | undefined;

  try {
    router = useRouter();
    pathname = usePathname();
    const queryParams = useQueryParams<{ windowId?: string; recordId?: string }>();
    windowId = queryParams.windowId;
    recordId = queryParams.recordId;
  } catch (error) {
    console.warn("Router not ready yet, using defaults:", error);
    // Usar valores por defecto si el router no está listo
  }

  const [tabs, setTabs] = useState<NavigationTab[]>([
    {
      id: HOME_TAB_ID,
      title: "Dashboard",
      url: "/",
      type: "home",
      isActive: true,
      canClose: false,
      icon: "🏠",
      lastActive: Date.now(),
    },
  ]);

  const [activeTabId, setActiveTabId] = useState(HOME_TAB_ID);

  // Efecto para detectar cuando el router está listo
  useEffect(() => {
    if (router && !isRouterReady) {
      console.log("Router is now ready");
      setIsRouterReady(true);
    }
  }, [router, isRouterReady]);

  // Función para navegar de forma segura
  const safeNavigate = useCallback(
    (url: string) => {
      if (router && isRouterReady) {
        console.log("Safe navigate to:", url);
        router.push(url);
      } else {
        console.warn("Router not ready, navigation deferred:", url);
        // Optionally, you could queue navigation for when router is ready
        if (typeof window !== "undefined") {
          window.location.href = url;
        }
      }
    },
    [router, isRouterReady]
  );

  // Función para generar IDs únicos basados en URL
  const generateTabId = useCallback((url: string) => {
    return `tab_${btoa(url).replace(/[^a-zA-Z0-9]/g, "")}`;
  }, []);

  // Función para construir URL con parámetros
  const buildUrl = useCallback((windowId?: string, recordId?: string) => {
    if (!windowId) return "/";

    const params = new URLSearchParams();
    params.set("windowId", windowId);
    if (recordId) {
      params.set("recordId", recordId);
    }

    return `/window?${params.toString()}`;
  }, []);

  // Función para extraer información de una URL
  const parseUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const windowId = urlObj.searchParams.get("windowId") || undefined;
      const recordId = urlObj.searchParams.get("recordId") || undefined;
      const isHome = urlObj.pathname === "/";

      return {
        windowId,
        recordId,
        isHome,
        type: isHome ? ("home" as const) : ("window" as const),
      };
    } catch {
      return { windowId: undefined, recordId: undefined, isHome: true, type: "home" as const };
    }
  }, []);

  // CORE: Agregar o activar tab basado en URL actual
  const addOrActivateTab = useCallback(
    (url: string, forceWindowId?: string, forceRecordId?: string) => {
      console.log("addOrActivateTab called:", { url, forceWindowId, forceRecordId, isRouterReady });

      const tabId = generateTabId(url);
      const urlInfo = parseUrl(url);
      const finalWindowId = forceWindowId || urlInfo.windowId;
      const finalRecordId = forceRecordId || urlInfo.recordId;

      setTabs((prevTabs) => {
        // Buscar si ya existe una tab para esta URL exacta
        const existingTab = prevTabs.find((tab) => tab.id === tabId);

        if (existingTab) {
          console.log("addOrActivateTab - Activating existing tab:", tabId);
          // Activar tab existente y actualizar timestamp
          setActiveTabId(tabId);
          return prevTabs.map((tab) => ({
            ...tab,
            isActive: tab.id === tabId,
            lastActive: tab.id === tabId ? Date.now() : tab.lastActive,
          }));
        }

        // Si es home, activar la tab existente
        if (urlInfo.isHome) {
          console.log("addOrActivateTab - Activating home tab");
          setActiveTabId(HOME_TAB_ID);
          return prevTabs.map((tab) => ({
            ...tab,
            isActive: tab.id === HOME_TAB_ID,
            lastActive: tab.id === HOME_TAB_ID ? Date.now() : tab.lastActive,
          }));
        }

        console.log("addOrActivateTab - Creating new tab:", tabId);

        // Crear nueva tab
        const newTab: NavigationTab = {
          id: tabId,
          title: "Loading...",
          windowId: finalWindowId,
          recordId: finalRecordId,
          url,
          type: urlInfo.type,
          isActive: true,
          canClose: true,
          lastActive: Date.now(),
          metadata: {
            mode: finalRecordId ? "form" : "table",
          },
        };

        // Desactivar todas las tabs y agregar la nueva
        const updatedTabs = prevTabs.map((tab) => ({ ...tab, isActive: false }));

        // Si llegamos al límite, cerrar la tab más antigua (excepto Home)
        if (updatedTabs.length >= MAX_TABS) {
          const closableTabs = updatedTabs.filter((tab) => tab.canClose).sort((a, b) => a.lastActive - b.lastActive);
          if (closableTabs.length > 0) {
            const tabToRemove = closableTabs[0];
            const index = updatedTabs.findIndex((tab) => tab.id === tabToRemove.id);
            if (index > -1) {
              updatedTabs.splice(index, 1);
            }
          }
        }

        setActiveTabId(tabId);
        return [...updatedTabs, newTab];
      });
    },
    [generateTabId, parseUrl]
  );

  // Cerrar tab
  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        const tabToClose = prevTabs.find((tab) => tab.id === tabId);
        if (!tabToClose || !tabToClose.canClose) return prevTabs;

        const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // Si cerramos la tab activa, activar la más reciente
        if (tabToClose.isActive && updatedTabs.length > 0) {
          const mostRecentTab = updatedTabs.sort((a, b) => b.lastActive - a.lastActive)[0];
          mostRecentTab.isActive = true;
          setActiveTabId(mostRecentTab.id);

          // Navegar a la tab más reciente de forma segura
          console.log("closeTab - Navigating to most recent tab:", mostRecentTab.url);
          safeNavigate(mostRecentTab.url);
        }

        return updatedTabs;
      });
    },
    [safeNavigate]
  );

  // Cambiar a tab específica
  const switchToTab = useCallback(
    (tabId: string) => {
      console.log("switchToTab called:", tabId);

      const targetTab = tabs.find((tab) => tab.id === tabId);
      if (!targetTab) return;

      setTabs((prevTabs) =>
        prevTabs.map((tab) => ({
          ...tab,
          isActive: tab.id === tabId,
          lastActive: tab.id === tabId ? Date.now() : tab.lastActive,
        }))
      );

      setActiveTabId(tabId);

      // Navegar a la URL de la tab de forma segura
      console.log("switchToTab - Navigating to:", targetTab.url);
      safeNavigate(targetTab.url);
    },
    [tabs, safeNavigate]
  );

  // Actualizar título de tab
  const updateTabTitle = useCallback((tabId: string, title: string) => {
    console.log("updateTabTitle called:", { tabId, title });

    setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)));
  }, []);

  // Actualizar metadata de tab
  const updateTabMetadata = useCallback((tabId: string, metadata: Partial<NavigationTab["metadata"]>) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              metadata: { ...tab.metadata, ...metadata },
            }
          : tab
      )
    );
  }, []);

  // Actualizar estado de ventana (para memoización)
  const updateTabState = useCallback((tabId: string, state: Partial<NavigationTab["metadata"]["windowState"]>) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              metadata: {
                ...tab.metadata,
                windowState: { ...tab.metadata?.windowState, ...state },
              },
            }
          : tab
      )
    );
  }, []);

  // Obtener tab por ID
  const getTabById = useCallback(
    (tabId: string) => {
      return tabs.find((tab) => tab.id === tabId);
    },
    [tabs]
  );

  // Obtener tab activa
  const getActiveTab = useCallback(() => {
    return tabs.find((tab) => tab.isActive);
  }, [tabs]);

  // Navegar desde item del menú - SIMPLIFICADO Y SEGURO
  const navigateFromMenu = useCallback(
    (menuItem: Menu) => {
      console.log("navigateFromMenu called:", menuItem, "isRouterReady:", isRouterReady);

      if (!isRouterReady) {
        console.warn("Router not ready, deferring navigation");
        return;
      }

      if (menuItem.windowId) {
        const url = buildUrl(menuItem.windowId, menuItem.recordId);
        console.log("navigateFromMenu - Navigating to:", url);
        safeNavigate(url);
      } else if (menuItem.action) {
        const url = `/${menuItem.action}?id=${menuItem.id}`;
        console.log("navigateFromMenu - Navigating to action:", url);
        safeNavigate(url);
      }
    },
    [buildUrl, safeNavigate, isRouterReady]
  );

  useEffect(() => {
    if (!isRouterReady) {
      console.log("Router not ready, skipping URL sync");
      return;
    }

    const currentUrl = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;

    console.log("NavigationTabs URL sync:", {
      pathname,
      windowId,
      recordId,
      currentUrl,
      activeTabId,
      isRouterReady,
    });

    addOrActivateTab(currentUrl, windowId, recordId);
  }, [pathname, windowId, recordId, addOrActivateTab, isRouterReady, activeTabId]);

  // Valor del contexto
  const value = useMemo<NavigationTabsContextType>(
    () => ({
      tabs,
      activeTabId,
      addOrActivateTab,
      closeTab,
      switchToTab,
      updateTabTitle,
      updateTabMetadata,
      updateTabState,
      getTabById,
      getActiveTab,
      navigateFromMenu,
      isReady: isRouterReady,
    }),
    [
      tabs,
      activeTabId,
      addOrActivateTab,
      closeTab,
      switchToTab,
      updateTabTitle,
      updateTabMetadata,
      updateTabState,
      getTabById,
      getActiveTab,
      navigateFromMenu,
      isRouterReady,
    ]
  );

  return <NavigationTabsContext.Provider value={value}>{children}</NavigationTabsContext.Provider>;
}

// Hook para usar el contexto
export const useNavigationTabs = () => {
  const context = useContext(NavigationTabsContext);

  if (context === undefined) {
    throw new Error("useNavigationTabs must be used within a NavigationTabsProvider");
  }

  return context;
};
