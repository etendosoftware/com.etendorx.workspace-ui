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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import { useFavoritesContext } from "@/contexts/favorites";
import type { WidgetClass, WidgetInstance } from "@workspaceui/api-client/src/api/dashboard";
import CTABanner from "./widgets/CTABanner";
import AddWidgetDialog from "./widgets/AddWidgetDialog";
import EditWidgetParamsDialog from "./widgets/EditWidgetParamsDialog";
import DashboardGrid from "./widgets/DashboardGrid";

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LOADING_SKELETON_COUNT = 4;

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="Home__loading_skeleton">
      {Array.from({ length: LOADING_SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-baseline-10 p-5 h-40 animate-pulse">
          <div className="h-3 rounded bg-transparent-neutral-10 w-1/3 mb-4" />
          <div className="h-3 rounded bg-transparent-neutral-10 w-3/4 mb-2" />
          <div className="h-3 rounded bg-transparent-neutral-10 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { currentRole } = useUserContext();
  const {
    layout,
    widgetData,
    widgetErrors,
    isLoadingLayout,
    layoutError,
    widgetClasses,
    isLoadingClasses,
    classesError,
    loadWidgetClasses,
    addWidget,
    removeWidget,
    fetchWidgetPage,
    updateLayout,
    refreshWidget,
    updateParams,
  } = useDashboard(currentRole?.id);

  const { subscribeToToggle } = useFavoritesContext();

  // Refresh all FAVORITES widgets after a toggle so the chips update immediately.
  const favoritesInstanceIds = useMemo(
    () => layout.filter((w) => w.type === "FAVORITES").map((w) => w.instanceId),
    [layout]
  );

  useEffect(() => {
    if (favoritesInstanceIds.length === 0) return;
    const unsubscribe = subscribeToToggle(() => {
      for (const id of favoritesInstanceIds) refreshWidget(id);
    });
    return unsubscribe;
  }, [favoritesInstanceIds, refreshWidget, subscribeToToggle]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingInstance, setEditingInstance] = useState<WidgetInstance | null>(null);
  const [isSavingParams, setIsSavingParams] = useState(false);

  const editableClassIds = useMemo(
    () => new Set(widgetClasses.filter((wc) => wc.params.some((p) => !p.fixed)).map((wc) => wc.widgetClassId)),
    [widgetClasses]
  );

  const editingWidgetClass = useMemo(
    () =>
      editingInstance ? (widgetClasses.find((wc) => wc.widgetClassId === editingInstance.widgetClassId) ?? null) : null,
    [editingInstance, widgetClasses]
  );

  const handleRemove = useCallback(
    (instanceId: string) => {
      removeWidget(instanceId);
    },
    [removeWidget]
  );

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
    loadWidgetClasses();
  }, [loadWidgetClasses]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setAddError(null);
  }, []);

  const handleEditParams = useCallback(
    (instanceId: string) => {
      const instance = layout.find((w) => w.instanceId === instanceId) ?? null;
      setEditingInstance(instance);
      if (widgetClasses.length === 0) loadWidgetClasses();
    },
    [layout, widgetClasses, loadWidgetClasses]
  );

  const handleCloseEditDialog = useCallback(() => {
    setEditingInstance(null);
  }, []);

  const handleSaveParams = useCallback(
    async (instanceId: string, parameters: Record<string, string>) => {
      setIsSavingParams(true);
      try {
        await updateParams(instanceId, parameters);
        setEditingInstance(null);
      } finally {
        setIsSavingParams(false);
      }
    },
    [updateParams]
  );

  const handleAddWidget = useCallback(
    async (widgetClass: WidgetClass, parameters: Record<string, string>) => {
      setIsAdding(true);
      setAddError(null);
      try {
        await addWidget({
          widgetClassId: widgetClass.widgetClassId,
          width: widgetClass.defaultWidth,
          height: widgetClass.defaultHeight,
          parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        });
        setDialogOpen(false);
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "error");
      } finally {
        setIsAdding(false);
      }
    },
    [addWidget]
  );

  const sortedLayout = [...layout].sort((a, b) => {
    if (a.position.row !== b.position.row) return a.position.row - b.position.row;
    return a.position.col - b.position.col;
  });

  return (
    <div className="flex flex-col gap-4 w-full h-full overflow-y-auto p-4" data-testid="Home__container">
      <CTABanner data-testid="CTABanner__dashboard" />
      {isLoadingLayout && <LoadingSkeleton data-testid="LoadingSkeleton__3ef224" />}
      {layoutError && !isLoadingLayout && (
        <div
          className="rounded-2xl bg-error-contrast-text p-5 text-sm text-error-main"
          data-testid="Home__layout_error">
          {t("dashboard.loadError")}
        </div>
      )}
      {/* Toolbar: add widget button */}
      {!isLoadingLayout && !layoutError && (
        <div className="flex items-center justify-end" data-testid="Home__toolbar">
          <button
            type="button"
            onClick={handleOpenDialog}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-transparent-neutral-5 hover:bg-transparent-neutral-10 border border-transparent-neutral-10 text-baseline-100 transition-colors cursor-pointer"
            data-testid="Home__add_widget_btn">
            <PlusIcon data-testid="PlusIcon__3ef224" />
            {t("dashboard.addWidget.button")}
          </button>
        </div>
      )}
      {!isLoadingLayout && !layoutError && sortedLayout.length === 0 && (
        <p className="text-sm text-baseline-50 p-2" data-testid="Home__no_widgets">
          {t("dashboard.noWidgets")}
        </p>
      )}
      {!isLoadingLayout && !layoutError && sortedLayout.length > 0 && (
        <DashboardGrid
          instances={sortedLayout}
          widgetData={widgetData}
          widgetErrors={widgetErrors}
          editableClassIds={editableClassIds}
          onRemove={handleRemove}
          onEditParams={handleEditParams}
          onFetchPage={fetchWidgetPage}
          onUpdateLayout={updateLayout}
          data-testid="DashboardGrid__home"
        />
      )}
      <EditWidgetParamsDialog
        open={editingInstance !== null}
        instance={editingInstance}
        widgetClass={editingWidgetClass}
        isSaving={isSavingParams}
        onClose={handleCloseEditDialog}
        onSave={handleSaveParams}
        data-testid="EditWidgetParamsDialog__home"
      />
      <AddWidgetDialog
        open={dialogOpen}
        widgetClasses={widgetClasses}
        isLoadingClasses={isLoadingClasses}
        classesError={classesError}
        isAdding={isAdding}
        addedWidgetClassIds={new Set(layout.map((w) => w.widgetClassId))}
        submitError={addError}
        onClose={handleCloseDialog}
        onAdd={handleAddWidget}
        data-testid="AddWidgetDialog__home"
      />
    </div>
  );
}
