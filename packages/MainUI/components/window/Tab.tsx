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

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import { AttachmentProvider } from "@/contexts/AttachmentContext";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect, useState, useRef } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID, FORM_MODES, TAB_MODES, type TabFormState } from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { getNewTabFormState, isFormView } from "@/utils/window/utils";
import { useWindowContext } from "@/contexts/window";
import { useUserContext } from "@/hooks/useUserContext";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { extractJSessionId } from "@/app/api/_utils/sessionRecovery";

/**
 * Validates if a child tab can open FormView based on parent selection in context
 */
const validateParentSelectionForFormView = (
  tab: TabLevelProps["tab"],
  graph: ReturnType<typeof useSelected>["graph"],
  windowId: string,
  getSelectedRecord: (windowId: string, tabId: string) => string | undefined
): boolean => {
  const parentTab = graph.getParent(tab);
  if (!parentTab) {
    return true; // No parent, validation passes
  }

  const parentSelectedInContext = getSelectedRecord(windowId, parentTab.id);
  return !!parentSelectedInContext;
};

/**
 * Handles setting tab form state for new record
 */
const handleNewRecordFormState = (
  windowId: string,
  tabId: string,
  recordId: string,
  setTabFormState: (windowId: string, tabId: string, formState: TabFormState) => void
): void => {
  const newTabFormState = getNewTabFormState(recordId, TAB_MODES.FORM, FORM_MODES.NEW);
  setTabFormState(windowId, tabId, newTabFormState);
};

/**
 * Handles setting tab form state for editing existing record
 */
const handleEditRecordFormState = (
  windowId: string,
  tabId: string,
  newValue: string,
  selectedRecordId: string | undefined,
  setSelectedRecord: (windowId: string, tabId: string, recordId: string) => void,
  setTabFormState: (windowId: string, tabId: string, formState: TabFormState) => void
): void => {
  const formMode = FORM_MODES.EDIT;
  const newTabFormState = getNewTabFormState(newValue, TAB_MODES.FORM, formMode);

  if (selectedRecordId !== newValue) {
    // Record selection changed - update selection first, then form state
    setSelectedRecord(windowId, tabId, newValue);
    setTimeout(() => {
      setTabFormState(windowId, tabId, newTabFormState);
    }, 50);
  } else {
    // Same record - just open form
    setTabFormState(windowId, tabId, newTabFormState);
  }
};

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const {
    activeWindow,
    clearSelectedRecord,
    getTabFormState,
    setSelectedRecord,
    getSelectedRecord,
    clearTabFormState,
    setTabFormState,
    clearChildrenSelections,
    getTableState,
  } = useWindowContext();
  const { registerActions, onRefresh } = useToolbarContext();
  const { graph } = useSelected();
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  const { token } = useUserContext();
  const selectedRecord = useSelectedRecord(tab);
  const [toggle, setToggle] = useState(false);
  const [isIframeOpen, setIsIframeOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const lastParentSelectionRef = useRef<Map<string, string | undefined>>(new Map());

  const windowIdentifier = activeWindow?.windowIdentifier;

  const tabFormState = windowIdentifier ? getTabFormState(windowIdentifier, tab.id) : undefined;
  const selectedRecordId = windowIdentifier ? getSelectedRecord(windowIdentifier, tab.id) : undefined;

  const currentMode = tabFormState?.mode || TAB_MODES.TABLE;
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  // For child tabs, verify parent has selection before showing FormView
  const parentTab = graph.getParent(tab);
  const parentSelectedRecordId =
    parentTab && windowIdentifier ? getSelectedRecord(windowIdentifier, parentTab.id) : undefined;
  const parentHasSelection = !parentTab || !!parentSelectedRecordId;

  const hasFormViewState = !!tabFormState && tabFormState.mode === TAB_MODES.FORM;
  const shouldShowForm =
    hasFormViewState || isFormView({ currentMode, recordId: currentRecordId, hasParentSelection: parentHasSelection });
  const formMode = currentFormMode === FORM_MODES.NEW ? FormMode.NEW : FormMode.EDIT;

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      if (!windowIdentifier) {
        return;
      }

      // Handle clearing form state (empty value)
      if (!newValue) {
        clearTabFormState(windowIdentifier, tab.id);
        return;
      }

      // Validate parent selection for child tabs
      if (!validateParentSelectionForFormView(tab, graph, windowIdentifier, getSelectedRecord)) {
        return; // Don't allow child to open form if parent has no selection
      }

      // Handle new record
      if (newValue === NEW_RECORD_ID) {
        handleNewRecordFormState(windowIdentifier, tab.id, newValue, setTabFormState);
        return;
      }

      // Handle editing existing record
      handleEditRecordFormState(
        windowIdentifier,
        tab.id,
        newValue,
        selectedRecordId,
        setSelectedRecord,
        setTabFormState
      );
    },
    [
      currentRecordId,
      windowIdentifier,
      setTabFormState,
      clearTabFormState,
      setSelectedRecord,
      selectedRecordId,
      getSelectedRecord,
      graph,
      tab,
    ]
  );

  const handleRecordSelection = useCallback(
    (recordId: string) => {
      if (windowIdentifier) {
        if (recordId) {
          setSelectedRecord(windowIdentifier, tab.id, recordId);
        } else {
          clearSelectedRecord(windowIdentifier, tab.id);

          // Clear children tabs when deselecting parent record
          const children = graph.getChildren(tab);
          if (children && children.length > 0) {
            const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
            if (childIds.length > 0) {
              clearChildrenSelections(windowIdentifier, childIds);
            }
          }

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowIdentifier, tab, setSelectedRecord, clearSelectedRecord, clearChildrenSelections, graph]
  );

  const handleNew = useCallback(() => {
    if (windowIdentifier) {
      const newTabFormState = getNewTabFormState(NEW_RECORD_ID, TAB_MODES.FORM, FORM_MODES.NEW);
      setTabFormState(windowIdentifier, tab.id, newTabFormState);
    }
  }, [windowIdentifier, tab, setTabFormState]);

  const handleBack = useCallback(() => {
    if (windowIdentifier) {
      const currentFormState = getTabFormState(windowIdentifier, tab.id);
      const isInFormView = currentFormState?.mode === TAB_MODES.FORM;

      if (isInFormView) {
        clearTabFormState(windowIdentifier, tab.id);
      } else {
        clearSelectedRecord(windowIdentifier, tab.id);

        // Also clear children if this tab has any
        const children = graph.getChildren(tab);
        if (children && children.length > 0) {
          const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
          if (childIds.length > 0) {
            clearChildrenSelections(windowIdentifier, childIds);
          }
        }

        // Clear graph selection
        graph.clearSelected(tab);
      }
    }
  }, [windowIdentifier, clearTabFormState, tab, getTabFormState, clearSelectedRecord, clearChildrenSelections, graph]);

  const handleTreeView = useCallback(() => {
    if (windowIdentifier) {
      setToggle((prev) => !prev);
    }
  }, [windowIdentifier]);

  // /**
  //  * Calls PrinterReports.html to validate/prepare print parameters before generating the PDF
  //  * DEPRECATED: Now using PrintOptions.html directly
  //  */
  // const callPrinterReports = useCallback(
  //   async (recordData: Record<string, unknown>) => {
  //     if (!token) {
  //       throw new Error("Authorization token not found");
  //     }

  //     // Build form data from record parameters
  //     const formData = new URLSearchParams();

  //     // Add all record parameters
  //     for (const [key, value] of Object.entries(recordData)) {
  //       if (value !== null && value !== undefined) {
  //         formData.append(key, String(value));
  //       }
  //     }

  //     // Make POST request to PrinterReports.html
  //     const response = await fetch("/api/erp/businessUtility/PrinterReports.html?IsPopUpCall=1", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/x-www-form-urlencoded",
  //         Accept:
  //           "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  //       },
  //       credentials: "include",
  //       body: formData.toString(),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`PrinterReports validation failed: ${response.status} ${response.statusText}`);
  //     }

  //     return response;
  //   },
  //   [token]
  // );

  const handlePrintDocument = useCallback(async () => {
    try {
      // Validate prerequisites
      if (!selectedRecordId || selectedRecordId === NEW_RECORD_ID) {
        console.warn("No record selected for printing");
        return;
      }

      if (!token) {
        throw new Error("Authorization token not found. Please log in again.");
      }

      if (!windowIdentifier) {
        throw new Error("Window context not found");
      }

      if (!selectedRecord) {
        throw new Error("Selected record data not available");
      }

      // Build hardcoded record parameters for PrinterReports validation
      const recordParams: Record<string, unknown> = {
        Command: "DEFAULT",
        inppdfpath: "etendo/orders/print.html",
        inphiddenkey: "inpcOrderId",
        inpdirectprint: "N",
        inpButtonType: "printButton",
        inpcReturnReasonId: "undefined",
        inprmPickfromshipment: "",
        inprmReceivematerials: "",
        inprmCreateinvoice: "",
        inptotallines: "2.04",
        inpadUserId: "undefined",
        inpcDoctypeId: "0",
        inpsoResStatus: "",
        inpemAprmAddpayment: "N",
        inpdocaction: "AP",
        inpcopyfrom: "N",
        inpcopyfrompo: "N",
        inpdeliveryviarule: "P",
        inpmShipperId: "null",
        inpdeliveryrule: "A",
        inpfreightcostrule: "I",
        inpfreightamt: "0.00",
        inpisdiscountprinted: "N",
        inppriorityrule: "5",
        inpcCampaignId: "undefined",
        inpchargeamt: "0.00",
        inpcChargeId: "undefined",
        inpcActivityId: "undefined",
        inpadOrgtrxId: "undefined",
        inpcalculatePromotions: "N",
        inprmAddorphanline: "",
        inpconvertquotation: "",
        inpcRejectReasonId: "undefined",
        inpvaliduntil: "null",
        inpreplacementorderId: "null",
        inpcancelandreplace: "N",
        inppaymentstatus: "undefined",
        inpconfirmcancelandreplace: "N",
        inpemEtblkcBulkcompletion: "N",
        inpcOrderId: selectedRecordId,
        inpadClientId: "23C59575B9CF467C9620760EB255B389",
        inpisactive: "Y",
        inpisinvoiced: "N",
        inpisprinted: "N",
        inpdateacct: "null",
        inpprocessing: "N",
        inpprocessed: "N",
        inpdateprinted: "null",
        inpissotrx: "Y",
        inppaymentrule: "P",
        inpposted: "N",
        inpistaxincluded: "",
        inpisselected: "N",
        inpdropshipUserId: "undefined",
        inpdropshipBpartnerId: "undefined",
        inpdropshipLocationId: "undefined",
        inpisselfservice: "N",
        inpgeneratetemplate: "N",
        inpdeliverynotes: "undefined",
        inpcIncotermsId: "undefined",
        inpincotermsdescription: "undefined",
        C_Order_ID: selectedRecordId,
        inpadOrgId: "7BABA5FF80494CAFA54DEBD22EC46F01",
        inpcDoctypetargetId: "6EC4290580E9454DA24A4EA3E59EBD68",
        inpdocumentno: "1000000",
        inpdateordered: "13-12-2025",
        inpcBpartnerId: "B3ABB0B4AFEA4541AC1E29891D496079",
        inpcBpartnerLocationId: "AE7263454E1C48CD80DABBCCBFE831DD",
        inpmPricelistId: "8366EAF1EDF442A98377D74A199084A8",
        inpdatepromised: "29-09-2025",
        inpfinPaymentmethodId: "15263EF498404ED3BEA2077023A4B68C",
        inpcPaymenttermId: "66BA1164A7394344BB9CD1A6ECEED05D",
        inpmWarehouseId: "9CF98A18BC754B99998E421F91C5FE12",
        inpinvoicerule: "D",
        inpporeference: "undefined",
        inpsalesrepId: "undefined",
        inpdescription: "undefined",
        inpbilltoId: "AE7263454E1C48CD80DABBCCBFE831DD",
        inpdeliveryLocationId: "undefined",
        inpquotationId: "",
        inpcancelledorderId: "null",
        inpreplacedorderId: "null",
        inpiscancelled: "N",
        inpbpartnerExtref: "null",
        inpcProjectId: "",
        inpcCostcenterId: "",
        inpaAssetId: "",
        inpuser1Id: "",
        inpuser2Id: "",
        inpdocstatus: "DR",
        inpgrandtotal: "2.04",
        inpcCurrencyId: "100",
        inpdeliverystatus: "0",
        inpinvoicestatus: "0",
        inpisdelivered: "N",
        inpTabId: "186",
        inpwindowId: "143",
        inpTableId: "259",
        inpkeyColumnId: "C_Order_ID",
        keyProperty: "id",
        inpKeyName: "inpcOrderId",
        keyColumnName: "C_Order_ID",
        keyPropertyType: "_id_13",
        inphiddenvalue: selectedRecordId,
      };

      // Step 1: Call PrinterReports.html to validate/prepare
      const printerReportsFormData = new URLSearchParams();
      for (const [key, value] of Object.entries(recordParams)) {
        if (value !== null && value !== undefined) {
          printerReportsFormData.append(key, String(value));
        }
      }

      console.log("Step 1: Calling PrinterReports.html...");
      const printerReportsResponse = await fetch("/api/erp/businessUtility/PrinterReports.html?IsPopUpCall=1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        },
        credentials: "include",
        body: printerReportsFormData.toString(),
      });
      console.log("PrinterReports response status:", printerReportsResponse.status);

      // Extract JSESSIONID from PrinterReports response
      const jsessionId = extractJSessionId(printerReportsResponse);
      console.log("Extracted JSESSIONID from PrinterReports:", jsessionId);

      // Step 2: Call PrintOptions.html with hardcoded parameters
      console.log("Step 2: Calling PrintOptions.html...");
      const printOptionsFormData = new URLSearchParams();
      printOptionsFormData.append("Command", "ARCHIVE");
      printOptionsFormData.append("IsPopUpCall", "1");
      printOptionsFormData.append("inpLastFieldChanged", "");
      printOptionsFormData.append("inpKey", "");
      printOptionsFormData.append("inpwindowId", "");
      printOptionsFormData.append("inpTabId", "");
      printOptionsFormData.append("inpDocumentId", "('D307587ACBA0450C8EC2C9F379CC6592')");
      printOptionsFormData.append("draftDocumentIds", "");

      // Build headers for PrintOptions with JSESSIONID if extracted
      const printOptionsHeaders: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Origin: "http://localhost:8080",
        Referer: "http://localhost:8080/etendo/orders/print.html?Commnad=PDF&IsPopUpCall=1",
        "Upgrade-Insecure-Requests": "1",
      };

      // Combine JSESSIONID from PrinterReports with other cookies
      // Note: cookies: "include" will be sent by fetch, but Path=/etendo might prevent it
      // So we manually add JSESSIONID extracted from PrinterReports response
      if (jsessionId) {
        printOptionsHeaders.Cookie = `JSESSIONID=${jsessionId}`;
        console.log("Using JSESSIONID in PrintOptions request:", jsessionId);
      }

      const printResponse = await fetch("/api/erp/orders/PrintOptions.html", {
        method: "POST",
        headers: printOptionsHeaders,
        credentials: "include", // Include cookies for session
        body: printOptionsFormData.toString(),
      });

      if (!printResponse.ok) {
        throw new Error(`Print request failed: ${printResponse.status} ${printResponse.statusText}`);
      }

      // Get the response as HTML text
      const html = await printResponse.text();

      // Create a blob from the HTML
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      setIframeUrl(blobUrl);
      setIsIframeOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Print Document Error:", errorMessage, error);
      throw new Error(`Print failed: ${errorMessage}`);
    }
  }, [selectedRecordId, token, windowIdentifier, selectedRecord]);

  /**
   * Builds field metadata array matching SmartClient format
   */
  const buildFieldsArray = useCallback(
    (orderedFieldNames: string[], visibility: Record<string, boolean>, fields: Record<string, unknown> | undefined) => {
      const fieldsArray: Array<{
        name: string;
        visible?: boolean;
        frozen?: boolean;
        width?: number;
        autoFitWidth?: boolean;
      }> = [];

      // Skip UI-specific columns that are not entity fields
      const skipColumns = new Set(["_editLink", "mrt-row-select", "actions"]);

      // Add all fields with their metadata, excluding UI-specific columns
      for (const fieldName of orderedFieldNames) {
        if (skipColumns.has(fieldName)) continue;

        const field = fields?.[fieldName] as Record<string, unknown> | undefined;
        const isVisible = visibility[fieldName] !== false;

        // Determine width based on field type
        let width = 200;
        const fieldType = field?.type as string | undefined;
        if (["boolean", "date", "datetime", "number", "quantity"].includes(fieldType || "")) {
          width = 100;
        }

        fieldsArray.push({
          name: fieldName,
          visible: isVisible,
          width: width,
          ...(fieldType === "boolean" ? { autoFitWidth: false } : {}),
        });
      }

      return fieldsArray;
    },
    []
  );

  /**
   * Builds viewState string matching SmartClient format for Classic datasource
   * Format: ({field:"[...]",sort:"(...))",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})
   */
  const buildViewState = useCallback(
    (fieldsArray: Array<Record<string, unknown>>, sorting: Array<{ id: string; desc: boolean }>) => {
      const fieldJson = JSON.stringify(fieldsArray);

      let sortJson: string;
      if (sorting.length > 0) {
        const sortSpec = {
          fieldName: sorting[0].id,
          sortDir: sorting[0].desc ? "descending" : "ascending",
          sortSpecifiers: [
            {
              property: sorting[0].id,
              direction: sorting[0].desc ? "descending" : "ascending",
            },
          ],
        };
        sortJson = JSON.stringify(sortSpec);
      } else {
        sortJson = "null";
      }

      // Escape quotes properly for viewState parameter
      const escapedField = fieldJson.replace(/"/g, '\\"');
      const escapedSort = sortJson.replace(/"/g, '\\"');

      return `({field:"${escapedField}",sort:"(${escapedSort})",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})`;
    },
    []
  );

  /**
   * Builds implicit filter criteria for child tabs based on parent record selection
   * Matches parent link by comparing referencedEntity with parentTab.entityName
   */
  const buildImplicitFilterCriteria = useCallback(
    (parentTabArg: typeof tab | null | undefined, parentRecordId: string | undefined): Record<string, unknown>[] => {
      if (!parentTabArg || !parentRecordId) {
        return [];
      }

      // Find the field that links to the parent by matching referencedEntity with parentTab.entityName
      const parentLinkField = Object.entries(tab.fields || {}).find(([_, field]) => {
        const fieldData = field as unknown as Record<string, unknown>;
        return fieldData.referencedEntity === parentTabArg.entityName;
      });

      if (!parentLinkField) {
        return [];
      }

      const fieldName = parentLinkField[0];
      return [
        {
          fieldName,
          operator: "equals",
          value: parentRecordId,
          _constructor: "AdvancedCriteria",
        },
      ];
    },
    [tab]
  );

  /**
   * Builds export request parameters matching Classic datasource format
   */
  const buildExportParams = useCallback(
    (
      entityName: string,
      tabId: string,
      fieldsArray: Array<Record<string, unknown>>,
      sorting: Array<{ id: string; desc: boolean }>,
      filters: unknown[],
      isImplicitFilterApplied: boolean
    ): Record<string, unknown> => {
      const viewState = buildViewState(fieldsArray, sorting);

      const params: Record<string, unknown> = {
        _dataSource: "isc_OBViewDataSource_0",
        _operationType: "fetch",
        _noCount: true,
        exportAs: "csv",
        exportToFile: true,
        viewState: viewState,
        _extraProperties: "undefined",
        tabId: tabId,
        _textMatchStyle: "substring",
        _UTCOffsetMiliseconds: String(new Date().getTimezoneOffset() * -60000),
        operator: "and",
        _constructor: "AdvancedCriteria",
        criteria: filters.length > 0 ? filters : undefined,
        isImplicitFilterApplied: isImplicitFilterApplied,
        _startRow: 0,
        _endRow: 9999,
      };

      // Add only visible entity fields as @Entity.fieldName@=undefined (Classic format)
      // Only include fields that are visible (not hidden by user)
      for (const field of fieldsArray) {
        const fieldName = field.name as string;
        const isVisible = field.visible !== false; // Default to visible if not specified

        if (isVisible) {
          params[`@${entityName}.${fieldName}@`] = "undefined";
        }
      }

      // Add sorting parameter if present
      if (sorting.length > 0) {
        params._sortBy = sorting[0].id;
      }

      return params;
    },
    [buildViewState]
  );

  /**
   * Downloads CSV file to client
   */
  const downloadCSVFile = useCallback((csvContent: string) => {
    if (!csvContent.trim()) {
      throw new Error("No data to export");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "ExportedData.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }, []);

  /**
   * Validates export prerequisites
   */
  const validateExportData = useCallback(() => {
    if (!tab?.entityName) {
      throw new Error("Entity name not found");
    }
    if (!windowIdentifier) {
      throw new Error("Window context not found");
    }
    if (!tab.fields || Object.keys(tab.fields).length === 0) {
      throw new Error("No fields available for export");
    }
  }, [tab, windowIdentifier]);

  /**
   * Builds field name visibility map by combining metadata defaults with user overrides
   */
  const buildFieldNameVisibility = useCallback(
    (
      orderedFieldNames: string[],
      tableColumnVisibility: Record<string, boolean>,
      tabFields: Record<string, unknown>
    ): Record<string, boolean> => {
      const fieldNameVisibility: Record<string, boolean> = {};

      for (const fieldName of orderedFieldNames) {
        const field = tabFields[fieldName] as Record<string, unknown> | undefined;

        // Check if field has showInGridView property (initial visibility from metadata)
        let isVisible = field?.showInGridView !== false; // Default to visible

        // If field has a label, check tableColumnVisibility for user-set visibility
        if (field?.label && typeof field.label === "string") {
          const displayName = field.label;
          // If the display name exists in tableColumnVisibility, use that value (user override)
          if (displayName in tableColumnVisibility) {
            isVisible = tableColumnVisibility[displayName] !== false;
          }
        }

        fieldNameVisibility[fieldName] = isVisible;
      }

      return fieldNameVisibility;
    },
    []
  );

  /**
   * Extracts error message from nested response structure
   */
  const extractErrorFromResponse = useCallback((respObj: Record<string, unknown>): string | null => {
    // Check nested path: response.data.response.error
    if (respObj.data && typeof respObj.data === "object") {
      const dataObj = respObj.data as unknown as Record<string, unknown>;
      if (dataObj.response && typeof dataObj.response === "object") {
        const respData = dataObj.response as unknown as Record<string, unknown>;
        if (respData.error && typeof respData.error === "object") {
          const errorObj = respData.error as unknown as Record<string, unknown>;
          return String(errorObj.message || "Unknown backend error");
        }
      }
    }

    // Check top-level path: response.error
    if (respObj.response && typeof respObj.response === "object") {
      const respData = respObj.response as unknown as Record<string, unknown>;
      if (respData.error && typeof respData.error === "object") {
        const errorObj = respData.error as unknown as Record<string, unknown>;
        return String(errorObj.message || "Unknown backend error");
      }
    }

    return null;
  }, []);

  /**
   * Attempts to extract CSV content from data object
   */
  const tryExtractCSVFromDataObject = useCallback((dataObj: Record<string, unknown>): string => {
    if (typeof dataObj.text === "string") return dataObj.text;
    if (typeof dataObj.data === "string") return dataObj.data;
    if (typeof dataObj.csv === "string") return dataObj.csv;
    return "";
  }, []);

  /**
   * Attempts to extract CSV content from top-level object
   */
  const tryExtractCSVFromTopLevel = useCallback((respObj: Record<string, unknown>): string => {
    if (typeof respObj.text === "string") return respObj.text;
    if (typeof respObj.csv === "string") return respObj.csv;
    return "";
  }, []);

  /**
   * Extracts CSV content from various response structures
   */
  const extractCSVContent = useCallback(
    (response: unknown): { csvContent: string; backendError: string | null } => {
      // Try direct string response
      if (typeof response === "string") {
        return { csvContent: response, backendError: null };
      }

      const respObj = response as Record<string, unknown>;

      // Try response.data as string
      if (typeof respObj.data === "string") {
        return { csvContent: respObj.data, backendError: null };
      }

      // Extract errors first
      const backendError = extractErrorFromResponse(respObj);

      // Try nested data object
      if (respObj.data && typeof respObj.data === "object") {
        const dataObj = respObj.data as unknown as Record<string, unknown>;
        const csvContent = tryExtractCSVFromDataObject(dataObj);
        if (csvContent) {
          return { csvContent, backendError };
        }
      }

      // Try top-level properties
      const csvContent = tryExtractCSVFromTopLevel(respObj);
      if (csvContent) {
        return { csvContent, backendError };
      }

      return { csvContent: "", backendError };
    },
    [extractErrorFromResponse, tryExtractCSVFromDataObject, tryExtractCSVFromTopLevel]
  );

  const handleExportCSV = useCallback(async () => {
    try {
      validateExportData();

      if (!windowIdentifier) {
        throw new Error("Window context not found");
      }

      const { datasource } = await import("@workspaceui/api-client/src/api/datasource");

      // Get table state
      const tableState = getTableState(windowIdentifier, tab.id) || {};
      const {
        filters: tableColumnFilters = [],
        visibility: tableColumnVisibility = {},
        sorting: tableColumnSorting = [],
        isImplicitFilterApplied: stateIsImplicitFilterApplied = false,
      } = tableState;

      // Get field names from tab.fields (not display names from table column order)
      // Filter out the 'id' field and any UI-specific columns
      const skipColumns = new Set(["id", "_editLink", "mrt-row-select", "actions"]);
      const orderedFieldNames = Object.keys(tab.fields).filter((key) => !skipColumns.has(key));

      // Map field name visibility from display name visibility
      // tableColumnVisibility uses display names (e.g., "Gross Unit Price") as keys
      // We need to map to field names (e.g., "grossUnitPrice") for the export
      const fieldNameVisibility = buildFieldNameVisibility(orderedFieldNames, tableColumnVisibility, tab.fields);

      // Build field metadata
      const fieldsArray = buildFieldsArray(orderedFieldNames, fieldNameVisibility, tab.fields);

      // Build implicit filter criteria for child tabs
      const implicitFilterCriteria = buildImplicitFilterCriteria(parentTab, parentSelectedRecordId);

      // Combine implicit filter with table column filters
      const allFilters =
        implicitFilterCriteria.length > 0 ? [...implicitFilterCriteria, ...tableColumnFilters] : tableColumnFilters;

      // Build request parameters
      const params = buildExportParams(
        tab.entityName,
        tab.id,
        fieldsArray,
        tableColumnSorting,
        allFilters,
        stateIsImplicitFilterApplied
      );

      // Make API request
      const response = await datasource.get(tab.entityName, params);

      // Validate response
      if (!response) {
        throw new Error("No response from server");
      }

      console.log("CSV Export Response:", response);

      const respObj = response as unknown as Record<string, unknown>;
      if (respObj.__error) {
        throw new Error(`Export error: ${respObj.__error}`);
      }

      // Extract CSV content and check for errors
      const { csvContent, backendError } = extractCSVContent(response);

      if (backendError) {
        throw new Error(`CSV export backend error: ${backendError}`);
      }

      console.log("Final CSV content length:", csvContent.length);

      if (!csvContent || csvContent.trim().length === 0) {
        console.error(
          "Export returned empty data. Response structure (keys):",
          response && typeof response === "object" ? Object.keys(respObj) : typeof response
        );
        throw new Error("Export returned empty data - check browser console for response structure");
      }

      // Download file
      downloadCSVFile(csvContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred during export";
      console.error("CSV Export Error:", errorMessage, error);

      // Re-throw to trigger error boundary or toast notification
      throw new Error(`CSV Export failed: ${errorMessage}`);
    }
  }, [
    tab,
    windowIdentifier,
    getTableState,
    buildFieldsArray,
    buildFieldNameVisibility,
    buildExportParams,
    downloadCSVFile,
    validateExportData,
    extractCSVContent,
    parentTab,
    parentSelectedRecordId,
    buildImplicitFilterCriteria,
  ]);

  useEffect(() => {
    // Register this tab's refresh callback
    registerRefresh(tab.tabLevel, onRefresh);

    return () => {
      // Cleanup on unmount
      unregisterRefresh(tab.tabLevel);
    };
  }, [tab.tabLevel, onRefresh, registerRefresh, unregisterRefresh]);

  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
      treeView: handleTreeView,
      exportCSV: handleExportCSV,
      printDocument: handlePrintDocument,
    };

    registerActions(actions);
  }, [registerActions, handleNew, handleBack, handleTreeView, handleExportCSV, handlePrintDocument, tab.id]);

  /**
   * Clear selection when creating a new record
   * This prevents issues when creating a new record from a selected record in the table
   * which could lead to inconsistent state.
   */
  useEffect(() => {
    if (currentRecordId === NEW_RECORD_ID) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [currentRecordId, graph, tab]);

  // Auto-close child FormView when parent selection changes
  useEffect(() => {
    if (!windowIdentifier) {
      return;
    }

    const parentTab = graph.getParent(tab);
    if (!parentTab) {
      return; // Only for child tabs
    }

    const parentSelectedId = getSelectedRecord(windowIdentifier, parentTab.id);
    const previousParentId = lastParentSelectionRef.current.get(windowIdentifier);

    // Only process if parent selection ID actually changed
    if (parentSelectedId === previousParentId) {
      return; // No change, skip processing
    }

    // Update ref BEFORE any early returns
    lastParentSelectionRef.current.set(windowIdentifier, parentSelectedId);

    // Skip closing if this is a NEW -> real ID transition (save operation)
    const isParentSaveTransition =
      previousParentId === NEW_RECORD_ID && parentSelectedId && parentSelectedId !== NEW_RECORD_ID;

    // Close child FormView only if:
    // 1. There was a previous parent selection (not initial render)
    // 2. Parent selection changed to something else (different ID or undefined)
    // 3. This is NOT a save transition (NEW -> real ID)
    // Note: We now close child FormView even if parent is in FormView (navigation between parent records should reset children)
    if (previousParentId !== undefined && !isParentSaveTransition) {
      clearTabFormState(windowIdentifier, tab.id);
      graph.clearSelected(tab);
    }
  }, [
    windowIdentifier,
    graph,
    tab,
    getSelectedRecord,
    clearTabFormState,
    getTabFormState,
    currentMode,
    tabFormState?.mode,
  ]);

  return (
    <div
      className={`relative bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}>
      <Toolbar
        windowId={windowIdentifier || tab.window}
        tabId={tab.id}
        isFormView={shouldShowForm}
        data-testid="Toolbar__5893c8"
      />
      {shouldShowForm && (
        <div className="flex-1 h-full min-h-0 relative z-10">
          <FormView
            mode={formMode}
            tab={tab}
            window={window}
            recordId={currentRecordId}
            setRecordId={handleSetRecordId}
            data-testid="FormView__5893c8"
          />
        </div>
      )}
      <div
        className={
          !shouldShowForm
            ? "flex-1 h-full min-h-0"
            : "absolute top-0 left-0 w-full h-full invisible opacity-0 z-[-1] pointer-events-none"
        }>
        <AttachmentProvider data-testid="AttachmentProvider__5893c8">
          <DynamicTable
            isTreeMode={toggle}
            setRecordId={handleSetRecordId}
            onRecordSelection={handleRecordSelection}
            isVisible={!shouldShowForm}
            data-testid="DynamicTable__5893c8"
          />
        </AttachmentProvider>
      </div>

      {isIframeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Print Preview</h2>
              <button
                type="button"
                onClick={() => {
                  setIsIframeOpen(false);
                  if (iframeUrl) {
                    URL.revokeObjectURL(iframeUrl);
                  }
                  setIframeUrl("");
                }}
                className="text-gray-600 hover:text-gray-900 font-bold text-xl">
                ×
              </button>
            </div>
            <iframe src={iframeUrl} className="flex-1 w-full h-full" title="Print Preview" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Tab;
