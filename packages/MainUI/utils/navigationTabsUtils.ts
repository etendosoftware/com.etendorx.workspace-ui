import type { NavigationTab } from "@/contexts/navigationTabs";

/**
 * Utilidades para el manejo de navigation tabs
 */
export class NavigationTabsUtils {
  static saveTabs(tabs: NavigationTab[]) {
    try {
      const persistableData = tabs
        .filter((tab) => tab.canClose)
        .map((tab) => ({
          title: tab.title,
          windowId: tab.windowId,
          recordId: tab.recordId,
          url: tab.url,
          type: tab.type,
          metadata: tab.metadata,
          icon: tab.icon,
        }));

      localStorage.setItem("navigationTabs", JSON.stringify(persistableData));
    } catch (error) {
      console.warn("Failed to save navigation tabs:", error);
    }
  }

  static loadTabs(): Partial<NavigationTab>[] {
    try {
      const stored = localStorage.getItem("navigationTabs");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load navigation tabs:", error);
      return [];
    }
  }

  static clearPersistedTabs() {
    try {
      localStorage.removeItem("navigationTabs");
    } catch (error) {
      console.warn("Failed to clear navigation tabs:", error);
    }
  }

  static generateSmartTitle(windowName: string, recordId?: string, entityName?: string): string {
    if (!recordId) {
      return windowName;
    }

    if (recordId === "new") {
      return `New ${entityName || "Record"}`;
    }

    const displayId = recordId.length > 20 ? "Record" : recordId;
    return `${windowName} - ${displayId}`;
  }

  static getWindowIcon(windowType?: string): string {
    switch (windowType) {
      case "sales":
        return "💰";
      case "purchase":
        return "🛒";
      case "inventory":
        return "📦";
      case "finance":
        return "💸";
      case "hr":
        return "👥";
      default:
        return "📄";
    }
  }
}
