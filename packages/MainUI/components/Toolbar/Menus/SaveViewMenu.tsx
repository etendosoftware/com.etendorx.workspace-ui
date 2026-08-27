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
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { useTranslation } from "@/hooks/useTranslation";
import { useSavedViews } from "@/hooks/useSavedViews";
import { useUserStore } from "@/stores/userStore";
import type { TranslateFunction, TranslationKeys } from "@/hooks/types";
import type { ParsedSavedView, SavedViewScope } from "@/utils/savedViews/types";
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";

/**
 * Mirrors the backend's canManageScope gate (SavedViewService#canManageScope): a plain
 * business role carries userLevel "O" only, while Client/System administrator roles
 * additionally carry "C"/"S" — only those may define a shared (non-USER) view. This is a
 * UX convenience to hide options the backend would reject anyway; the backend re-checks.
 */
function getManageableScopes(userLevel: string | undefined): SavedViewScope[] {
  const level = userLevel ?? "";
  const scopes: SavedViewScope[] = ["USER"];
  if (level.includes("C") || level.includes("S")) {
    scopes.push("ROLE", "ORGANIZATION", "CLIENT");
  }
  if (level.includes("S")) {
    scopes.push("SYSTEM");
  }
  return scopes;
}

function getSetDefaultTitle(view: ParsedSavedView, t: TranslateFunction): string {
  if (!view.editable) {
    return t("savedViews.notEditable");
  }
  return view.isDefault ? t("savedViews.defaultView") : t("savedViews.setAsDefault");
}

const SCOPE_LABEL_KEYS: Record<SavedViewScope, TranslationKeys> = {
  USER: "savedViews.scopeUser",
  ROLE: "savedViews.scopeRole",
  ORGANIZATION: "savedViews.scopeOrganization",
  CLIENT: "savedViews.scopeClient",
  SYSTEM: "savedViews.scopeSystem",
};

export interface SaveViewMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  tabId: string;
  currentFilters: MRT_ColumnFiltersState;
  currentVisibility: MRT_VisibilityState;
  currentSorting: MRT_SortingState;
  currentOrder: string[];
  isImplicitFilterApplied: boolean;
  /** Metadata default implicit-filter state, used when resetting to the standard view. */
  defaultImplicitFilterApplied: boolean;
  onApplyView: (state: {
    filters: MRT_ColumnFiltersState;
    visibility: MRT_VisibilityState;
    sorting: MRT_SortingState;
    order: string[];
    implicitFilterApplied: boolean;
  }) => void;
}

const SaveViewMenu: React.FC<SaveViewMenuProps> = ({
  anchorEl,
  onClose,
  tabId,
  currentFilters,
  currentVisibility,
  currentSorting,
  currentOrder,
  isImplicitFilterApplied,
  defaultImplicitFilterApplied,
  onApplyView,
}) => {
  const { t } = useTranslation();
  const {
    views,
    isLoading,
    isSaving,
    isDeleting,
    isUpdatingDefault,
    fetchViews,
    saveView,
    setDefaultView,
    unsetDefaultView,
    applyView,
    deleteView,
  } = useSavedViews();

  const currentRole = useUserStore((s) => s.currentRole);
  const manageableScopes = useMemo(() => getManageableScopes(currentRole?.userLevel), [currentRole?.userLevel]);

  const [newViewName, setNewViewName] = useState("");
  const [scope, setScope] = useState<SavedViewScope>("USER");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Fetch views when the menu opens
  useEffect(() => {
    if (anchorEl && tabId) {
      fetchViews(tabId).catch(() => {
        // error handled in hook
      });
    }
  }, [anchorEl, tabId, fetchViews]);

  // Reset local state when menu closes
  useEffect(() => {
    if (!anchorEl) {
      setShowSaveInput(false);
      setNewViewName("");
      setScope("USER");
      setConfirmDeleteId(null);
      setOperationError(null);
    }
  }, [anchorEl]);

  const handleSaveClick = useCallback(() => {
    setShowSaveInput(true);
    setOperationError(null);
  }, []);

  const handleSaveConfirm = useCallback(async () => {
    const trimmedName = newViewName.trim();
    if (!trimmedName) return;

    if (trimmedName.length > 100) {
      setOperationError(t("savedViews.error"));
      return;
    }

    setOperationError(null);

    try {
      await saveView({
        tabId,
        name: trimmedName,
        filters: currentFilters,
        visibility: currentVisibility,
        sorting: currentSorting,
        order: currentOrder,
        implicitFilterApplied: isImplicitFilterApplied,
        scope: scope === "USER" ? undefined : scope,
      });
      setShowSaveInput(false);
      setNewViewName("");
      setScope("USER");
    } catch {
      setOperationError(t("savedViews.error"));
    }
  }, [
    newViewName,
    tabId,
    currentFilters,
    currentVisibility,
    currentSorting,
    currentOrder,
    isImplicitFilterApplied,
    scope,
    saveView,
    t,
  ]);

  const handleSaveCancel = useCallback(() => {
    setShowSaveInput(false);
    setNewViewName("");
    setScope("USER");
    setOperationError(null);
  }, []);

  const handleSetDefault = useCallback(
    async (viewId: string) => {
      setOperationError(null);
      try {
        await setDefaultView(viewId);
      } catch {
        setOperationError(t("savedViews.setDefaultError"));
      }
    },
    [setDefaultView, t]
  );

  const handleResetToStandard = useCallback(async () => {
    setOperationError(null);
    try {
      await unsetDefaultView(tabId);
    } catch {
      setOperationError(t("savedViews.setDefaultError"));
      return;
    }
    onApplyView({
      filters: [],
      visibility: {},
      sorting: [],
      order: [],
      implicitFilterApplied: defaultImplicitFilterApplied,
    });
    onClose();
  }, [unsetDefaultView, tabId, onApplyView, onClose, t, defaultImplicitFilterApplied]);

  const handleApplyView = useCallback(
    (view: ParsedSavedView) => {
      const state = applyView(view);
      if (state) {
        onApplyView(state);
        onClose();
      }
    },
    [applyView, onApplyView, onClose]
  );

  const handleDeleteClick = useCallback((viewId: string) => {
    setConfirmDeleteId(viewId);
    setOperationError(null);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (viewId: string) => {
      setOperationError(null);
      try {
        await deleteView(viewId);
        setConfirmDeleteId(null);
      } catch {
        setOperationError(t("savedViews.deleteError"));
      }
    },
    [deleteView, t]
  );

  const handleDeleteCancel = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const handleKeyDownSaveInput = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSaveConfirm();
      } else if (event.key === "Escape") {
        handleSaveCancel();
      }
    },
    [handleSaveConfirm, handleSaveCancel]
  );

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl min-w-[220px]" data-testid="SaveViewMenu__menu">
      <div className="rounded-2xl px-2 py-4 flex flex-col gap-1" data-testid="SaveViewMenu__container">
        {/* Reset to standard view */}
        {!showSaveInput && (
          <button
            type="button"
            className="w-full text-left cursor-pointer rounded-lg px-2 py-2 transition hover:bg-(--color-baseline-20) text-sm font-medium disabled:opacity-50"
            onClick={handleResetToStandard}
            disabled={isUpdatingDefault}
            data-testid="SaveViewMenu__reset-button">
            {isUpdatingDefault ? t("common.loading") : t("savedViews.resetToStandard")}
          </button>
        )}

        {/* Save current view action */}
        {!showSaveInput && (
          <button
            type="button"
            className="w-full text-left cursor-pointer rounded-lg px-2 py-2 transition hover:bg-(--color-baseline-20) text-sm font-medium"
            onClick={handleSaveClick}
            disabled={isSaving}
            data-testid="SaveViewMenu__save-button">
            {isSaving ? t("common.loading") : t("savedViews.saveCurrentView")}
          </button>
        )}

        {/* Save input form */}
        {showSaveInput && (
          <div className="flex flex-col gap-2 px-1 py-1" data-testid="SaveViewMenu__save-form">
            <input
              type="text"
              className="w-full border border-(--color-transparent-neutral-20) rounded-lg px-2 py-1 text-sm outline-none focus:border-(--color-dynamic-main)"
              placeholder={t("savedViews.viewName")}
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={handleKeyDownSaveInput}
              maxLength={100}
              data-testid="SaveViewMenu__name-input"
            />
            {manageableScopes.length > 1 && (
              <select
                className="w-full border border-(--color-transparent-neutral-20) rounded-lg px-2 py-1 text-sm outline-none focus:border-(--color-dynamic-main) bg-(--color-baseline-0)"
                value={scope}
                onChange={(e) => setScope(e.target.value as SavedViewScope)}
                data-testid="SaveViewMenu__scope-select">
                {manageableScopes.map((s) => (
                  <option key={s} value={s}>
                    {t(SCOPE_LABEL_KEYS[s])}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                className="flex-1 rounded-lg px-2 py-1 text-xs bg-(--color-dynamic-main) text-(--color-baseline-0) hover:opacity-90 disabled:opacity-50"
                onClick={handleSaveConfirm}
                disabled={isSaving || !newViewName.trim()}
                data-testid="SaveViewMenu__confirm-save">
                {isSaving ? t("common.loading") : t("savedViews.save")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg px-2 py-1 text-xs border border-(--color-transparent-neutral-20) hover:bg-(--color-baseline-20)"
                onClick={handleSaveCancel}
                disabled={isSaving}
                data-testid="SaveViewMenu__cancel-save">
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {operationError && (
          <p className="text-xs text-red-500 px-2" data-testid="SaveViewMenu__error">
            {operationError}
          </p>
        )}

        {/* Divider */}
        <hr className="my-1 border-(--color-transparent-neutral-10)" />

        {/* Saved views list */}
        {isLoading && (
          <p className="text-xs text-(--color-transparent-neutral-60) px-2 py-1" data-testid="SaveViewMenu__loading">
            {t("common.loading")}
          </p>
        )}

        {!isLoading && views.length === 0 && (
          <p className="text-xs text-(--color-transparent-neutral-60) px-2 py-1" data-testid="SaveViewMenu__empty">
            {t("savedViews.noSavedViews")}
          </p>
        )}

        {!isLoading &&
          views.map((view) => (
            <div
              key={view.id}
              className="flex items-center justify-between gap-1 rounded-lg px-2 py-1 group hover:bg-(--color-baseline-20)"
              data-testid={`SaveViewMenu__view-item-${view.id}`}>
              {confirmDeleteId === view.id ? (
                <div className="flex items-center gap-1 w-full" data-testid="SaveViewMenu__confirm-delete">
                  <span className="text-xs text-(--color-transparent-neutral-80) flex-1">
                    {t("savedViews.confirmDelete")}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    onClick={() => handleDeleteConfirm(view.id)}
                    disabled={isDeleting}
                    data-testid="SaveViewMenu__confirm-delete-yes">
                    {t("savedViews.delete")}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-(--color-transparent-neutral-60) hover:underline"
                    onClick={handleDeleteCancel}
                    data-testid="SaveViewMenu__confirm-delete-no">
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex-1 text-left text-sm cursor-pointer truncate flex items-center gap-1"
                    onClick={() => handleApplyView(view)}
                    title={view.name}
                    data-testid="SaveViewMenu__view-apply">
                    <span className="truncate">{view.name}</span>
                    {view.scope !== "USER" && (
                      <span
                        className="shrink-0 text-[10px] uppercase tracking-wide text-(--color-transparent-neutral-60) border border-(--color-transparent-neutral-20) rounded px-1"
                        title={t("savedViews.sharedView")}
                        data-testid="SaveViewMenu__view-scope-badge">
                        {t("savedViews.sharedView")}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`text-xs shrink-0 transition-opacity disabled:opacity-40 ${
                      view.isDefault
                        ? "text-(--color-dynamic-main)"
                        : "text-(--color-transparent-neutral-40) hover:text-(--color-dynamic-main) opacity-0 group-hover:opacity-100"
                    }`}
                    onClick={() => !view.isDefault && view.editable && handleSetDefault(view.id)}
                    disabled={isUpdatingDefault || view.isDefault || !view.editable}
                    aria-label={t("savedViews.setAsDefault")}
                    title={getSetDefaultTitle(view, t)}
                    data-testid="SaveViewMenu__view-set-default">
                    {view.isDefault ? (
                      <StarIcon fontSize="small" data-testid="StarIcon__f77826" />
                    ) : (
                      <StarBorderIcon fontSize="small" data-testid="StarBorderIcon__f77826" />
                    )}
                  </button>
                  {view.editable && (
                    <button
                      type="button"
                      className="text-xs text-(--color-transparent-neutral-40) hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDeleteClick(view.id)}
                      aria-label={t("savedViews.delete")}
                      data-testid="SaveViewMenu__view-delete">
                      <DeleteOutlineIcon fontSize="small" data-testid="DeleteOutlineIcon__f77826" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
      </div>
    </Menu>
  );
};

SaveViewMenu.displayName = "SaveViewMenu";
export default SaveViewMenu;
