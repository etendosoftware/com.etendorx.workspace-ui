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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import type { FormPersonalizationScope } from "@workspaceui/api-client/src/api/formPersonalization";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import DragIcon from "@workspaceui/componentlibrary/src/assets/icons/drag.svg";
import EyeIcon from "@workspaceui/componentlibrary/src/assets/icons/eye.svg";
import EyeOffIcon from "@workspaceui/componentlibrary/src/assets/icons/eye-off.svg";
import LayoutIcon from "@workspaceui/componentlibrary/src/assets/icons/layout.svg";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import SortableList, { type SortableHandleProps } from "@workspaceui/componentlibrary/src/components/SortableList";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormPersonalization } from "@/hooks/useFormPersonalization";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import {
  buildEditorItems,
  type EditorField,
  type EditorItem,
  type EditorSection,
  editorItemsToForm,
  MAX_COL_SPAN,
  MIN_COL_SPAN,
  setFirstFocus,
  updateEditorItem,
} from "@/utils/form/personalizeEditor";
import { logger } from "@/utils/logger";

const MODAL_WIDTH = 760;
// The shared icons declare fill="current", which browsers ignore, so they are painted from the text color here.
const ICON_FILL = "[&_path]:fill-current";
const CHOICE_BASE =
  "appearance-none h-4 w-4 shrink-0 cursor-pointer border border-(--color-transparent-neutral-30) bg-white checked:border-(--color-etendo-main) checked:bg-(--color-etendo-main) disabled:opacity-40 disabled:cursor-default";
const CHECKBOX_CLASS = `${CHOICE_BASE} rounded checked:shadow-[inset_0_0_0_3px_white]`;
const RADIO_CLASS = `${CHOICE_BASE} rounded-full checked:shadow-[inset_0_0_0_3px_white]`;
const CELL_VISIBLE = "w-12 flex justify-center";
const CELL_COLUMNS = "w-16 flex justify-center";
const CELL_NEW_ROW = "w-16 flex justify-center";
const CELL_FOCUS = "w-14 flex justify-center";
const COLUMN_OPTIONS = Array.from({ length: MAX_COL_SPAN - MIN_COL_SPAN + 1 }, (_, i) => MIN_COL_SPAN + i);
const SCOPE_LABEL_KEYS = {
  USER: "formPersonalization.scope.USER",
  ROLE: "formPersonalization.scope.ROLE",
  ORGANIZATION: "formPersonalization.scope.ORGANIZATION",
  CLIENT: "formPersonalization.scope.CLIENT",
  SYSTEM: "formPersonalization.scope.SYSTEM",
} as const;

interface PersonalizeFormModalProps {
  /** The tab whose form is personalized, with the fields as the dictionary defines them. */
  tab: Tab;
  onClose: () => void;
}

/**
 * Editor of the form layout of a tab, the counterpart of Classic's "Personalize Form": reorder fields and
 * sections by dragging, show or hide fields, choose the columns each takes, where a row starts, which field
 * takes the focus and whether a section opens expanded. The result is saved for the user or, for
 * administrators, for a role, an organization, the client or the whole system.
 *
 * Mount it while it is open: it starts from the form as it is shown at that moment.
 */
const PersonalizeFormModal: React.FC<PersonalizeFormModalProps> = ({ tab, onClose }) => {
  const { t } = useTranslation();
  const currentRoleId = useUserStore((s) => s.currentRole?.id);
  const currentOrgId = useUserStore((s) => s.currentOrganization?.id);
  const { personalization, permissions, save, discard } = useFormPersonalization(tab.id);

  // Strings, not an object, so the effect below only reruns when a label actually changes.
  const mainTitle = t("forms.sections.main");
  const statusBarTitle = t("formPersonalization.statusBar");
  const [items, setItems] = useState<EditorItem[]>(() =>
    buildEditorItems(tab.fields, personalization?.form, { main: mainTitle, statusBar: statusBarTitle })
  );
  const [touched, setTouched] = useState(false);
  const [scope, setScope] = useState<FormPersonalizationScope>("USER");
  const [roleId, setRoleId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // The personalization may arrive after the modal opens; follow it until the user starts editing.
  useEffect(() => {
    if (!touched) {
      setItems(buildEditorItems(tab.fields, personalization?.form, { main: mainTitle, statusBar: statusBarTitle }));
    }
  }, [tab.fields, personalization?.form, mainTitle, statusBarTitle, touched]);

  const change = useCallback((next: EditorItem[]) => {
    setTouched(true);
    setItems(next);
  }, []);

  const statusBarHeader = items[0];
  const listItems = useMemo(() => items.slice(1), [items]);
  const statusBarIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of listItems) {
      if (item.kind === "section") break;
      ids.add(item.id);
    }
    return ids;
  }, [listItems]);

  const handleReorder = useCallback(
    (next: EditorItem[]) => change([statusBarHeader, ...next]),
    [change, statusBarHeader]
  );

  const defaultRoleId =
    permissions.roles.find((role) => role.id === currentRoleId)?.id ?? permissions.roles[0]?.id ?? "";
  const defaultOrgId =
    permissions.organizations.find((org) => org.id === currentOrgId)?.id ?? permissions.organizations[0]?.id ?? "";
  const effectiveRoleId = roleId || defaultRoleId;
  const effectiveOrgId = orgId || defaultOrgId;

  const canDiscard = Boolean(personalization?.canEdit);
  const sharedReadOnly = Boolean(personalization && !personalization.canEdit && personalization.scope !== "USER");

  const handleSave = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await save({
        form: editorItemsToForm(items),
        scope,
        ...(scope === "ROLE" ? { role: effectiveRoleId } : {}),
        ...(scope === "ORGANIZATION" ? { organization: effectiveOrgId } : {}),
      });
      onClose();
    } catch (e) {
      logger.warn("[PersonalizeForm] Could not save the personalization:", e);
      setError(t("formPersonalization.saveError"));
      setBusy(false);
    }
  }, [save, items, scope, effectiveRoleId, effectiveOrgId, onClose, t]);

  const handleReset = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await discard();
      onClose();
    } catch (e) {
      logger.warn("[PersonalizeForm] Could not discard the personalization:", e);
      setError(t("formPersonalization.resetError"));
      setConfirmingReset(false);
      setBusy(false);
    }
  }, [discard, onClose, t]);

  const renderHandle = (handle: SortableHandleProps) => (
    <button
      type="button"
      ref={handle.setActivatorNodeRef}
      className="flex items-center cursor-grab text-(--color-transparent-neutral-70) hover:text-(--color-baseline-100)"
      title={t("formPersonalization.dragToMove")}
      aria-label={t("formPersonalization.dragToMove")}
      {...handle.attributes}
      {...handle.listeners}>
      <DragIcon width={16} height={16} className={ICON_FILL} data-testid="DragIcon__a05d04" />
    </button>
  );

  const renderSection = (section: EditorSection, handle: SortableHandleProps) => (
    <div
      className="flex items-center gap-2 mt-3 px-2 py-2 rounded-lg bg-(--color-transparent-neutral-5)"
      data-testid={`personalize-section-${section.id}`}>
      {renderHandle(handle)}
      <span className="flex-1 text-sm font-semibold text-(--color-baseline-100)">{section.title}</span>
      <label className="flex items-center gap-1 text-xs text-(--color-transparent-neutral-70)">
        <input
          type="checkbox"
          className={CHECKBOX_CLASS}
          checked={section.expanded}
          aria-label={t("formPersonalization.sectionExpanded")}
          onChange={(e) => change(updateEditorItem<EditorSection>(items, section.id, { expanded: e.target.checked }))}
        />
        {t("formPersonalization.sectionExpanded")}
      </label>
    </div>
  );

  const renderField = (field: EditorField, handle: SortableHandleProps) => {
    const inStatusBar = statusBarIds.has(field.id);
    const hideDisabled = field.mandatory && !field.hidden;
    return (
      <div
        className="flex items-center gap-3 px-2 py-1.5 border-b border-(--color-transparent-neutral-10)"
        data-testid={`personalize-field-${field.id}`}>
        {renderHandle(handle)}
        <span
          className={`flex-1 text-sm truncate ${field.hidden ? "text-(--color-transparent-neutral-40) line-through" : ""}`}
          title={field.title}>
          {field.title}
          {field.mandatory && <span className="ml-1 text-red-600">*</span>}
        </span>
        <div className={CELL_VISIBLE}>
          <button
            type="button"
            disabled={hideDisabled}
            className="flex items-center text-(--color-transparent-neutral-70) hover:text-(--color-baseline-100) disabled:opacity-40"
            title={
              hideDisabled
                ? t("formPersonalization.mandatoryNotHideable")
                : field.hidden
                  ? t("formPersonalization.show")
                  : t("formPersonalization.hide")
            }
            aria-label={field.hidden ? t("formPersonalization.show") : t("formPersonalization.hide")}
            onClick={() => change(updateEditorItem<EditorField>(items, field.id, { hidden: !field.hidden }))}>
            {field.hidden ? (
              <EyeOffIcon width={18} height={18} className={ICON_FILL} data-testid={`EyeOffIcon__${field.id}`} />
            ) : (
              <EyeIcon width={18} height={18} className={ICON_FILL} data-testid={`EyeIcon__${field.id}`} />
            )}
          </button>
        </div>
        {inStatusBar ? (
          <>
            <span className={CELL_COLUMNS} />
            <span className={CELL_NEW_ROW} />
          </>
        ) : (
          <>
            <div className={CELL_COLUMNS}>
              <select
                className="text-xs border border-(--color-transparent-neutral-20) rounded px-1 py-0.5"
                value={field.colSpan}
                aria-label={t("formPersonalization.columns")}
                title={t("formPersonalization.columns")}
                onChange={(e) =>
                  change(updateEditorItem<EditorField>(items, field.id, { colSpan: Number(e.target.value) }))
                }>
                {COLUMN_OPTIONS.map((columns) => (
                  <option key={columns} value={columns}>
                    {columns}
                  </option>
                ))}
              </select>
            </div>
            <div className={CELL_NEW_ROW}>
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={field.startRow}
                aria-label={t("formPersonalization.startRow")}
                title={t("formPersonalization.startRow")}
                onChange={(e) => change(updateEditorItem<EditorField>(items, field.id, { startRow: e.target.checked }))}
              />
            </div>
          </>
        )}
        <div className={CELL_FOCUS}>
          <input
            type="radio"
            className={RADIO_CLASS}
            name="personalize-initial-focus"
            checked={field.firstFocus}
            disabled={field.hidden}
            aria-label={t("formPersonalization.initialFocus")}
            title={t("formPersonalization.initialFocus")}
            onChange={() => change(setFirstFocus(items, field.id))}
          />
        </div>
      </div>
    );
  };

  const buttons = (
    <div className="flex w-full items-center gap-6 pt-4 pb-2">
      {canDiscard && !confirmingReset && (
        <div className="w-auto">
          <Button
            variant="outlined"
            size="large"
            disabled={busy}
            onClick={() => setConfirmingReset(true)}
            data-testid="Button__a05d04">
            {t("formPersonalization.reset")}
          </Button>
        </div>
      )}
      {confirmingReset && (
        <>
          <span className="flex-1 text-xs text-(--color-transparent-neutral-70)">
            {t("formPersonalization.resetConfirm")}
          </span>
          <div className="w-auto">
            <Button
              variant="outlined"
              size="large"
              disabled={busy}
              onClick={() => setConfirmingReset(false)}
              data-testid="Button__a05d04">
              {t("common.cancel")}
            </Button>
          </div>
          <div className="w-auto">
            <Button variant="filled" size="large" disabled={busy} onClick={handleReset} data-testid="Button__a05d04">
              {t("formPersonalization.resetConfirmYes")}
            </Button>
          </div>
        </>
      )}
      {!confirmingReset && (
        <>
          <span className="flex-1" />
          <div className="w-auto">
            <Button variant="outlined" size="large" disabled={busy} onClick={onClose} data-testid="Button__a05d04">
              {t("common.cancel")}
            </Button>
          </div>
          <div className="w-auto">
            <Button variant="filled" size="large" disabled={busy} onClick={handleSave} data-testid="Button__a05d04">
              {t("formPersonalization.save")}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Modal
      open
      showHeader
      HeaderIcon={LayoutIcon}
      tittleHeader={t("formPersonalization.title")}
      descriptionText={t("formPersonalization.description")}
      width={MODAL_WIDTH}
      buttons={buttons}
      onClose={onClose}
      onCancel={onClose}
      data-testid="personalize-form-dialog">
      <div className="flex flex-col gap-3" data-testid="personalize-form-content">
        <div className="flex items-center gap-3" data-testid="personalize-form-scope">
          <label htmlFor="personalize-scope" className="text-sm font-medium">
            {t("formPersonalization.applyTo")}
          </label>
          <select
            id="personalize-scope"
            className="text-sm border border-(--color-transparent-neutral-20) rounded px-2 py-1"
            value={scope}
            onChange={(e) => setScope(e.target.value as FormPersonalizationScope)}>
            {permissions.scopes.map((option) => (
              <option key={option} value={option}>
                {t(SCOPE_LABEL_KEYS[option])}
              </option>
            ))}
          </select>
          {scope === "ROLE" && (
            <select
              className="text-sm border border-(--color-transparent-neutral-20) rounded px-2 py-1"
              value={effectiveRoleId}
              aria-label={t("formPersonalization.role")}
              onChange={(e) => setRoleId(e.target.value)}>
              {permissions.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          )}
          {scope === "ORGANIZATION" && (
            <select
              className="text-sm border border-(--color-transparent-neutral-20) rounded px-2 py-1"
              value={effectiveOrgId}
              aria-label={t("formPersonalization.organization")}
              onChange={(e) => setOrgId(e.target.value)}>
              {permissions.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {sharedReadOnly && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2" role="note">
            {t("formPersonalization.sharedReadOnly")}
          </p>
        )}
        <div
          className="flex items-center gap-3 px-2 text-xs font-medium text-(--color-transparent-neutral-70)"
          data-testid="personalize-form-column-headers">
          <span className="w-4" />
          <span className="flex-1" />
          <span className={CELL_VISIBLE}>{t("formPersonalization.headerVisible")}</span>
          <span className={CELL_COLUMNS}>{t("formPersonalization.headerColumns")}</span>
          <span className={CELL_NEW_ROW}>{t("formPersonalization.headerNewRow")}</span>
          <span className={CELL_FOCUS}>{t("formPersonalization.headerFocus")}</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {statusBarHeader?.kind === "section" && (
            <div
              className="flex items-center gap-2 px-2 py-2 rounded-lg bg-(--color-transparent-neutral-5)"
              data-testid="personalize-section-status-bar">
              <span className="text-sm font-semibold">{statusBarHeader.title}</span>
              <span className="flex-1 text-xs text-(--color-transparent-neutral-70)">
                {t("formPersonalization.statusBarHint")}
              </span>
            </div>
          )}
          <SortableList
            items={listItems}
            onReorder={handleReorder}
            renderItem={(item, handle) =>
              item.kind === "section" ? renderSection(item, handle) : renderField(item, handle)
            }
            data-testid="SortableList__a05d04"
          />
        </div>
        {error && (
          <p className="text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default PersonalizeFormModal;
