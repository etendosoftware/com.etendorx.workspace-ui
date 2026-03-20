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

import { useCallback } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier, createDefaultTabState } from "@/utils/window/utils";
import { FORM_MODES, TAB_MODES } from "@/utils/url/constants";
import type { TabState } from "@/utils/window/constants";

/**
 * Response from the Etendo Classic ReferencedLink endpoint.
 * This endpoint resolves the correct window and tab for a reference navigation,
 * taking into account the current window's sales/purchase context.
 */
interface ReferencedLinkResponse {
  windowId: string;
  tabId: string;
  recordId: string;
  tabTitle: string;
}

interface HandleActionProps {
  windowId: string;
  windowTitle: string;
  referencedTabId: string;
  selectedRecordId?: string;
  tabLevel?: number;
  /**
   * Additional context for resolving the correct window via ReferencedLink.
   * When provided, the endpoint is called to get the definitive windowId/tabId.
   */
  referencedLinkContext?: {
    entityName: string; // e.g. "OrderLine"
    fieldId: string; // AD_Field_ID
    currentWindowId: string; // The window the user is currently viewing
    columnName: string; // e.g. "C_OrderLine_ID"
  };
}

interface HandleClickRedirectProps {
  e: React.MouseEvent;
  windowId: string;
  windowTitle: string;
  referencedTabId: string;
  selectedRecordId?: string;
  tabLevel?: number;
  referencedLinkContext?: HandleActionProps["referencedLinkContext"];
}

interface HandleKeyDownRedirectProps {
  e: React.KeyboardEvent;
  windowId: string;
  windowTitle: string;
  referencedTabId: string;
  selectedRecordId?: string;
  tabLevel?: number;
  referencedLinkContext?: HandleActionProps["referencedLinkContext"];
}

export const useRedirect = () => {
  const { setWindowActive } = useWindowContext();

  /**
   * Calls the Etendo Classic ReferencedLink endpoint to resolve the correct
   * windowId and tabId for navigation. This is the same mechanism used by
   * Etendo Classic to handle Sales/Purchase window disambiguation.
   *
   * Re-routes the request through the Next.js proxy (/api/erp/utility/...)
   * to ensure authentication headers and session cookies are correctly applied.
   */
  const resolveViaReferencedLink = useCallback(
    async (
      context: HandleActionProps["referencedLinkContext"],
      recordId: string
    ): Promise<ReferencedLinkResponse | null> => {
      if (!context) return null;

      const { entityName, fieldId, currentWindowId, columnName } = context;
      if (!entityName || !fieldId || !currentWindowId || !columnName || !recordId) {
        console.debug("[useRedirect] ReferencedLink skipped - missing params:", {
          entityName,
          fieldId,
          currentWindowId,
          columnName,
          recordId,
        });
        return null;
      }

      const params = new URLSearchParams({
        Command: "JSON",
        inpEntityName: entityName,
        inpKeyReferenceId: recordId,
        inpwindowId: currentWindowId,
        inpKeyReferenceColumnName: columnName,
        inpFieldId: fieldId,
      });

      try {
        // Path relative to /api/erp baseUrl in Metadata.client
        const relativeUrl = `utility/ReferencedLink.html?${params.toString()}`;
        console.debug("[useRedirect] Calling ReferencedLink via proxy:", relativeUrl);

        const { ok, data, status } = await Metadata.client.request(relativeUrl);

        if (!ok) {
          console.warn("[useRedirect] ReferencedLink responded with status:", status);
          return null;
        }

        console.debug("[useRedirect] ReferencedLink response:", data);
        return data as ReferencedLinkResponse;
      } catch (err) {
        console.warn("[useRedirect] ReferencedLink call failed:", err);
        return null;
      }
    },
    []
  );

  const handleAction = useCallback(
    async ({
      windowId,
      windowTitle,
      referencedTabId,
      selectedRecordId,
      tabLevel = 0,
      referencedLinkContext,
    }: HandleActionProps) => {
      // Allow proceeding without windowId if referencedLinkContext is available to resolve it
      if (!windowId && !referencedLinkContext) {
        console.warn("No windowId found");
        return;
      }

      let resolvedWindowId = windowId;
      let resolvedTabId = referencedTabId;
      let resolvedTitle = windowTitle;

      // Use ReferencedLink to get the correct window/tab when context is available
      if (referencedLinkContext && selectedRecordId) {
        const resolved = await resolveViaReferencedLink(referencedLinkContext, selectedRecordId);
        if (resolved?.windowId) {
          resolvedWindowId = resolved.windowId;
          resolvedTabId = resolved.tabId || referencedTabId;
          resolvedTitle = resolved.tabTitle || windowTitle;
          console.debug("[useRedirect] Resolved via ReferencedLink:", {
            from: { windowId, referencedTabId },
            to: { windowId: resolvedWindowId, tabId: resolvedTabId },
          });
        }
      }

      if (!resolvedWindowId) {
        console.warn("[useRedirect] Could not resolve windowId via ReferencedLink");
        return;
      }

      console.debug("[useRedirect] Navigating to:", {
        windowId: resolvedWindowId,
        referencedTabId: resolvedTabId,
        selectedRecordId,
        windowTitle: resolvedTitle,
      });

      const newWindowIdentifier = getNewWindowIdentifier(resolvedWindowId);
      const defaultTabState = createDefaultTabState(tabLevel);
      const tabs = {
        [resolvedTabId]: {
          ...defaultTabState,
          form: {
            recordId: selectedRecordId,
            mode: TAB_MODES.FORM,
            formMode: FORM_MODES.EDIT,
          },
          selectedRecord: selectedRecordId,
        } as TabState,
      };
      const windowData = { title: resolvedTitle, tabs };
      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData });
    },
    [setWindowActive, resolveViaReferencedLink]
  );

  const handleClickRedirect = useCallback(
    ({
      e,
      windowId,
      windowTitle,
      referencedTabId,
      selectedRecordId,
      tabLevel,
      referencedLinkContext,
    }: HandleClickRedirectProps) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction({ windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel, referencedLinkContext });
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    ({
      e,
      windowId,
      windowTitle,
      referencedTabId,
      selectedRecordId,
      tabLevel,
      referencedLinkContext,
    }: HandleKeyDownRedirectProps) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction({ windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel, referencedLinkContext });
      }
    },
    [handleAction]
  );

  /**
   * Navigates to the window associated with a SmartClient `clientclass` value (e.g. "SalesOrderTabLink").
   * Resolves the target window by matching its display name against the cached menu, then fetches
   * the window metadata to obtain the root tab ID before navigating.
   *
   * @param clientclass - The clientclass string from field metadata (e.g. "SalesOrderTabLink")
   * @param recordId - The primary key of the record to open (row.original.id)
   */
  const handleClientclassNavigation = useCallback(
    async ({ clientclass, recordId }: { clientclass: string; recordId: string }) => {
      // "SalesOrderTabLink" → "SalesOrder" → "Sales Order"
      const entityPart = clientclass.replaceAll(/TabLink$/g, "");
      const displayName = entityPart.replaceAll(/([A-Z])/g, " $1").trim();

      const flattenMenu = (items: Menu[]): Menu[] =>
        items.flatMap((m) => [m, ...(m.children ? flattenMenu(m.children) : [])]);

      const flat = flattenMenu(Metadata.getCachedMenu());
      const menuItem = flat.find((item) => item.windowId && item.name?.toLowerCase() === displayName.toLowerCase());

      if (!menuItem?.windowId) {
        console.warn("[useRedirect] Could not find window for clientclass:", clientclass);
        return;
      }

      const resolvedWindowId = menuItem.windowId;
      let rootTabId = "";

      try {
        const windowMeta = await Metadata.getWindow(resolvedWindowId);
        const rootTab = windowMeta.tabs?.find((t) => t.tabLevel === 0);
        rootTabId = rootTab?.id ?? "";
      } catch (err) {
        console.warn("[useRedirect] Could not load window metadata for clientclass navigation:", err);
      }

      const newWindowIdentifier = getNewWindowIdentifier(resolvedWindowId);
      const defaultTabState = createDefaultTabState(0);
      const tabs = rootTabId
        ? {
            [rootTabId]: {
              ...defaultTabState,
              form: {
                recordId,
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
              selectedRecord: recordId,
            } as TabState,
          }
        : {};

      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData: { title: menuItem.name, tabs } });
    },
    [setWindowActive]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
    handleClientclassNavigation,
  };
};
