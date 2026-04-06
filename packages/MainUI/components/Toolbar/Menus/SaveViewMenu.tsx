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

import { useCallback, useEffect, useState } from "react";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "@/hooks/useTranslation";
import { useSavedViews } from "@/hooks/useSavedViews";
import type { ParsedSavedView } from "@/utils/savedViews/types";
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";

export interface SaveViewMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  tabId: string;
  currentFilters: MRT_ColumnFiltersState;
  currentVisibility: MRT_VisibilityState;
  currentSorting: MRT_SortingState;
  currentOrder: string[];
  onApplyView: (state: {
    filters: MRT_ColumnFiltersState;
    visibility: MRT_VisibilityState;
    sorting: MRT_SortingState;
    order: string[];
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
  onApplyView,
}) => {
  const { t } = useTranslation();
  const { views, isLoading, isSaving, isDeleting, fetchViews, saveView, applyView, deleteView } = useSavedViews();

  const [newViewName, setNewViewName] = useState("");
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
      });
      setShowSaveInput(false);
      setNewViewName("");
    } catch {
      setOperationError(t("savedViews.error"));
    }
  }, [newViewName, tabId, currentFilters, currentVisibility, currentSorting, currentOrder, saveView, t]);

  const handleSaveCancel = useCallback(() => {
    setShowSaveInput(false);
    setNewViewName("");
    setOperationError(null);
  }, []);

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
                    className="flex-1 text-left text-sm cursor-pointer truncate"
                    onClick={() => handleApplyView(view)}
                    title={view.name}
                    data-testid="SaveViewMenu__view-apply">
                    {view.name}
                    {view.isDefault && (
                      <span className="ml-1 text-xs text-(--color-transparent-neutral-60)">
                        ({t("savedViews.defaultView")})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-(--color-transparent-neutral-40) hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleDeleteClick(view.id)}
                    aria-label={t("savedViews.delete")}
                    data-testid="SaveViewMenu__view-delete">
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
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
