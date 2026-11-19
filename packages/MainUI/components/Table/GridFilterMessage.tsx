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

import { useCallback, useState } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import MessageBanner from "@/components/MessageBanner";
import { useServerLabels } from "@/hooks/useServerLabels";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindowStore } from "@/stores/windowStore";
import { persistPreference } from "@/utils/preferences/persistPreference";
import { sanitizeMessageHtml } from "@/utils/processes/definition/sanitizeHtml";
import {
  decideFilterMessage,
  FILTER_MESSAGE,
  FILTER_MESSAGE_PREFERENCES,
  FILTER_MESSAGE_TEXTS,
  type FilterMessageKind,
} from "@/utils/table/filterMessage";

const LABEL_KEYS = Object.values(FILTER_MESSAGE_TEXTS);
const LINE_BREAK = "<br/>";
const INFO = "info";

export interface GridFilterMessageProps {
  tab: Tab;
  windowIdentifier: string;
  isGridVisible: boolean;
  isImplicitFilterApplied: boolean;
  /** The grid is filtered by the id of one record. */
  hasIdFilter: boolean;
  hasParentSelection: boolean;
}

/**
 * First line of the message: the text of the default filter, from the metadata, or the single-record text.
 *
 * @returns The text, or `undefined` while it is not available
 */
function messageText(kind: FilterMessageKind, tab: Tab, labels: Record<string, string>): string | undefined {
  if (kind === FILTER_MESSAGE.IMPLICIT) {
    return tab.implicitFilterMessage;
  }
  return labels[FILTER_MESSAGE_TEXTS.SINGLE_RECORD];
}

/**
 * Body of the message, as classic `ob-grid.js`: its text and, on a second line, how to clear the filters.
 *
 * @returns The sanitized HTML, or `undefined` while its text is not available
 */
export function buildFilterMessageHtml(
  kind: FilterMessageKind,
  tab: Tab,
  labels: Record<string, string>
): string | undefined {
  const text = messageText(kind, tab, labels);
  if (!text) {
    return undefined;
  }
  const clearFilters = labels[FILTER_MESSAGE_TEXTS.CLEAR_FILTERS];
  return sanitizeMessageHtml(clearFilters ? `${text}${LINE_BREAK}${clearFilters}` : text);
}

/**
 * Information message over a grid that shows a filter the user did not set: the default filter of the tab
 * or the single record opened from a link, as the classic message bar does. Closing it hides it while the
 * window is open; "Never show this message again" stores the classic preference for the user.
 */
export default function GridFilterMessage({
  tab,
  windowIdentifier,
  isGridVisible,
  isImplicitFilterApplied,
  hasIdFilter,
  hasParentSelection,
}: GridFilterMessageProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<FilterMessageKind[]>([]);
  const initializedWithDirectLink = useWindowStore(
    (s) => s.windows[windowIdentifier]?.tabs[tab.id]?.initializedWithDirectLink ?? false
  );

  const kind = decideFilterMessage({
    isGridVisible,
    isDirectLink: hasIdFilter && initializedWithDirectLink,
    isImplicitFilterApplied,
    implicitFilterMessage: tab.implicitFilterMessage,
    hasParentSelection,
  });
  const visibleKind = kind && !dismissed.includes(kind) ? kind : null;
  const labels = useServerLabels(LABEL_KEYS, visibleKind !== null);

  const dismiss = useCallback((closed: FilterMessageKind) => setDismissed((prev) => [...prev, closed]), []);

  if (!visibleKind) {
    return null;
  }
  const html = buildFilterMessageHtml(visibleKind, tab, labels);
  if (!html) {
    return null;
  }
  const neverShowLabel = labels[FILTER_MESSAGE_TEXTS.NEVER_SHOW_AGAIN];
  const actions = neverShowLabel
    ? [
        {
          label: neverShowLabel,
          onClick: () => {
            void persistPreference(FILTER_MESSAGE_PREFERENCES[visibleKind], "N");
            dismiss(visibleKind);
          },
        },
      ]
    : [];

  return (
    <MessageBanner
      severity={INFO}
      html={html}
      actions={actions}
      onClose={() => dismiss(visibleKind)}
      closeLabel={t("common.close")}
      testIdPrefix="GridFilterMessage"
      data-testid="MessageBanner__gridfiltermessage"
    />
  );
}
