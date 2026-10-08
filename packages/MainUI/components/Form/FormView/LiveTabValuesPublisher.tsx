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

import { useEffect, useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useFormInitializationContext } from "@/contexts/FormInitializationContext";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";
import { getChildTabs, getTabDisplayLogicDependencies } from "@/utils/tabUtils";

/**
 * Form field holding the record id. Watched together with the dependencies so the published
 * values and the record they belong to always come from the same form state, even while the
 * form is switching records.
 */
export const RECORD_ID_FIELD = "id";

interface LiveTabValuesPublisherProps {
  tab: Tab;
  windowTabs?: Tab[];
}

interface WatchedValuesPublisherProps {
  windowIdentifier: string;
  tabId: string;
  dependencies: string[];
}

/** Maps the array `useWatch` returns back to the field names it was asked for. */
const toValuesByName = (names: string[], watched: unknown[]): Record<string, unknown> =>
  Object.fromEntries(names.map((name, index) => [name, watched[index]]));

/** Record id the form currently holds, or `undefined` for a form without a saved record. */
const toRecordId = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return String(value);
};

/**
 * Watches only the given fields and keeps their current values published for the record.
 * Split from {@link LiveTabValuesPublisher} so forms with nothing to watch never subscribe.
 */
const WatchedValuesPublisher = ({ windowIdentifier, tabId, dependencies }: WatchedValuesPublisherProps) => {
  const watchedNames = useMemo(() => [RECORD_ID_FIELD, ...dependencies], [dependencies]);
  const watched: unknown[] = useWatch({ name: watchedNames });
  const { isFormInitializing } = useFormInitializationContext();
  const publishTabValues = useLiveTabValuesStore((state) => state.publishTabValues);
  const clearTabValues = useLiveTabValuesStore((state) => state.clearTabValues);
  const recordId = toRecordId(watched[0]);
  const values = useMemo(() => toValuesByName(dependencies, watched.slice(1)), [dependencies, watched]);

  useEffect(() => {
    if (isFormInitializing) {
      return;
    }
    if (!recordId) {
      clearTabValues(windowIdentifier, tabId);
      return;
    }
    publishTabValues(windowIdentifier, tabId, { recordId, values });
  }, [isFormInitializing, windowIdentifier, tabId, recordId, values, publishTabValues, clearTabValues]);

  useEffect(() => () => clearTabValues(windowIdentifier, tabId), [windowIdentifier, tabId, clearTabValues]);

  return null;
};

/**
 * Publishes the form fields the child tabs' display logic depends on, so tab visibility
 * follows unsaved header edits (Classic calls `updateSubtabVisibility` on every item change).
 * Renders nothing and subscribes to nothing when no child tab has display logic.
 */
export default function LiveTabValuesPublisher({ tab, windowTabs }: LiveTabValuesPublisherProps) {
  const windowIdentifier = useCurrentWindowIdentifier();

  const dependencies = useMemo(
    () => getTabDisplayLogicDependencies(getChildTabs(windowTabs ?? [], tab), tab.fields),
    [windowTabs, tab]
  );

  if (!windowIdentifier || dependencies.length === 0) {
    return null;
  }

  return (
    <WatchedValuesPublisher
      windowIdentifier={windowIdentifier}
      tabId={tab.id}
      dependencies={dependencies}
      data-testid="WatchedValuesPublisher__9141c1"
    />
  );
}
