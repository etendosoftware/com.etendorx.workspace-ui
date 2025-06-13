"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  canClose: boolean; // Home no se puede cerrar
  metadata?: {
    entityName?: string;
    tabId?: string;
    mode?: "table" | "form";
  };
}

export interface NavigationTabsContextType {
  tabs: NavigationTab[];
  activeTabId: string;
  openTab: (config: Omit<NavigationTab, "id" | "isActive">) => string;
  closeTab: (tabId: string) => void;
  switchToTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  updateTabMetadata: (tabId: string, metadata: NavigationTab["metadata"]) => void;
  getTabById: (tabId: string) => NavigationTab | undefined;
  navigateToWindow: (windowId: string, recordId?: string) => void;
  navigateFromMenu: (menuItem: Menu) => void;
}

const NavigationTabsContext = createContext<NavigationTabsContextType>({} as NavigationTabsContextType);

const HOME_TAB_ID = "home";
const MAX_TABS = 10; // Límite de tabs como Chrome

export function NavigationTabsProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { windowId, recordId } = useQueryParams<{ windowId?: string; recordId?: string }>();

  // Estado interno para evitar bucles infinitos
  const isNavigatingRef = useRef(false);
  const lastProcessedUrl = useRef<string>("");

  const [tabs, setTabs] = useState<NavigationTab[]>([
    {
      id: HOME_TAB_ID,
      title: "Home",
      url: "/",
      type: "home",
      isActive: true,
      canClose: false,
      icon: "🏠",
    },
  ]);

  const [activeTabId, setActiveTabId] = useState(HOME_TAB_ID);

  // Función para generar IDs únicos
  const generateTabId = useCallback(() => {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Función para obtener URL actual
  const getCurrentUrl = useCallback(() => {
    return buildUrl(windowId, recordId);
  }, [buildUrl, windowId, recordId]);

  // Abrir nueva tab
  const openTab = useCallback(
    (config: Omit<NavigationTab, "id" | "isActive">) => {
      const newTabId = generateTabId();

      setTabs((prevTabs) => {
        // Verificar si ya existe una tab con la misma configuración
        const existingTab = prevTabs.find(
          (tab) => tab.windowId === config.windowId && tab.recordId === config.recordId && tab.type === config.type
        );

        if (existingTab) {
          // Si existe, activarla en lugar de crear una nueva
          setActiveTabId(existingTab.id);
          return prevTabs.map((tab) => ({
            ...tab,
            isActive: tab.id === existingTab.id,
          }));
        }

        // Crear nueva tab
        const newTab: NavigationTab = {
          ...config,
          id: newTabId,
          isActive: true,
        };

        // Si llegamos al límite, cerrar la tab más antigua (excepto Home)
        const updatedTabs = prevTabs.map((tab) => ({ ...tab, isActive: false }));

        if (updatedTabs.length >= MAX_TABS) {
          const oldestClosableIndex = updatedTabs.findIndex((tab) => tab.canClose);
          if (oldestClosableIndex !== -1) {
            updatedTabs.splice(oldestClosableIndex, 1);
          }
        }

        return [...updatedTabs, newTab];
      });

      setActiveTabId(newTabId);
      return newTabId;
    },
    [generateTabId]
  );

  // Cerrar tab
  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        const tabToClose = prevTabs.find((tab) => tab.id === tabId);
        if (!tabToClose || !tabToClose.canClose) return prevTabs;

        const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // Si cerramos la tab activa, activar otra
        if (tabToClose.isActive) {
          const newActiveTab = updatedTabs[updatedTabs.length - 1] || updatedTabs[0];
          if (newActiveTab) {
            newActiveTab.isActive = true;
            setActiveTabId(newActiveTab.id);

            // Navegar solo si no estamos ya navegando
            if (!isNavigatingRef.current) {
              isNavigatingRef.current = true;
              setTimeout(() => {
                router.push(newActiveTab.url);
                isNavigatingRef.current = false;
              }, 0);
            }
          }
        }

        return updatedTabs;
      });
    },
    [router]
  );

  // Cambiar a tab específica
  const switchToTab = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        const updatedTabs = prevTabs.map((tab) => ({
          ...tab,
          isActive: tab.id === tabId,
        }));

        const targetTab = updatedTabs.find((t) => t.id === tabId);
        if (targetTab && !isNavigatingRef.current) {
          setActiveTabId(tabId);

          // Solo navegar si la URL es diferente
          const currentUrl = getCurrentUrl();
          if (targetTab.url !== currentUrl) {
            isNavigatingRef.current = true;
            setTimeout(() => {
              router.push(targetTab.url);
              isNavigatingRef.current = false;
            }, 0);
          }
        }

        return updatedTabs;
      });
    },
    [router, getCurrentUrl]
  );

  // Actualizar título de tab
  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)));
  }, []);

  // Actualizar metadata de tab
  const updateTabMetadata = useCallback((tabId: string, metadata: NavigationTab["metadata"]) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.id === tabId ? { ...tab, metadata: { ...tab.metadata, ...metadata } } : tab))
    );
  }, []);

  // Obtener tab por ID
  const getTabById = useCallback(
    (tabId: string) => {
      return tabs.find((tab) => tab.id === tabId);
    },
    [tabs]
  );

  // Navegar a ventana específica
  const navigateToWindow = useCallback(
    (windowId: string, recordId?: string) => {
      const url = buildUrl(windowId, recordId);

      // Verificar si ya existe una tab para esta ventana
      const existingTab = tabs.find(
        (tab) => tab.windowId === windowId && tab.recordId === recordId && tab.type === "window"
      );

      if (existingTab) {
        switchToTab(existingTab.id);
        return;
      }

      openTab({
        title: "Loading...", // Se actualizará cuando se carguen los metadatos
        windowId,
        recordId,
        url,
        type: "window",
        canClose: true,
        metadata: {
          mode: recordId ? "form" : "table",
        },
      });
    },
    [openTab, buildUrl, tabs, switchToTab]
  );

  // Navegar desde item del menú
  const navigateFromMenu = useCallback(
    (menuItem: Menu) => {
      if (menuItem.windowId) {
        navigateToWindow(menuItem.windowId, menuItem.recordId);
      } else if (menuItem.action) {
        // Manejar otros tipos de acciones (procesos, reportes, etc.)
        const url = `/${menuItem.action}?id=${menuItem.id}`;

        openTab({
          title: menuItem.name,
          url,
          type: menuItem.type === "P" ? "process" : "report",
          canClose: true,
          icon: menuItem.icon || undefined,
        });
      }
    },
    [navigateToWindow, openTab]
  );

  // Sincronizar con cambios de URL - VERSIÓN MEJORADA SIN BUCLES
  useEffect(() => {
    const currentUrl = getCurrentUrl();

    // Evitar procesar la misma URL múltiples veces
    if (currentUrl === lastProcessedUrl.current || isNavigatingRef.current) {
      return;
    }

    lastProcessedUrl.current = currentUrl;

    if (pathname === "/") {
      // Estamos en home
      const homeTab = tabs.find((tab) => tab.type === "home");
      if (homeTab && !homeTab.isActive) {
        setTabs((prevTabs) =>
          prevTabs.map((tab) => ({
            ...tab,
            isActive: tab.type === "home",
          }))
        );
        setActiveTabId(HOME_TAB_ID);
      }
    } else if (pathname.startsWith("/window") && windowId) {
      // Estamos en una ventana
      const existingTab = tabs.find(
        (tab) => tab.windowId === windowId && tab.recordId === recordId && tab.type === "window"
      );

      if (existingTab) {
        if (!existingTab.isActive) {
          setTabs((prevTabs) =>
            prevTabs.map((tab) => ({
              ...tab,
              isActive: tab.id === existingTab.id,
            }))
          );
          setActiveTabId(existingTab.id);
        }
      } else {
        // No existe tab para esta ventana, crear una nueva
        // Pero solo si no estamos ya navegando
        if (!isNavigatingRef.current) {
          navigateToWindow(windowId, recordId);
        }
      }
    }
  }, [pathname, windowId, recordId, tabs, navigateToWindow, getCurrentUrl]);

  // Valor del contexto
  const value = useMemo<NavigationTabsContextType>(
    () => ({
      tabs,
      activeTabId,
      openTab,
      closeTab,
      switchToTab,
      updateTabTitle,
      updateTabMetadata,
      getTabById,
      navigateToWindow,
      navigateFromMenu,
    }),
    [
      tabs,
      activeTabId,
      openTab,
      closeTab,
      switchToTab,
      updateTabTitle,
      updateTabMetadata,
      getTabById,
      navigateToWindow,
      navigateFromMenu,
    ]
  );

  return <NavigationTabsContext.Provider value={value}>{children}</NavigationTabsContext.Provider>;
}

export const useNavigationTabs = () => {
  const context = useContext(NavigationTabsContext);

  if (context === undefined) {
    throw new Error("useNavigationTabs must be used within a NavigationTabsProvider");
  }

  return context;
};
