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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { CALLOUT_HIGHLIGHT_DURATION_MS } from "@/utils/callouts/calloutHighlight";

/** `{ [fieldName]: token }`: the token identifies the callout that highlighted the field. */
type ScopeHighlights = Record<string, number>;

interface CalloutHighlightStore {
  /** `{ [scope]: ScopeHighlights }` */
  highlights: Record<string, ScopeHighlights>;
  /** Highlights the fields a callout changed and fades them out after {@link CALLOUT_HIGHLIGHT_DURATION_MS}. */
  highlightFields: (scope: string, fieldNames: string[]) => void;
}

let lastToken = 0;

/** Drops the fields of a scope that are still highlighted by the given callout token. */
const withoutToken = (highlights: Record<string, ScopeHighlights>, scope: string, token: number) => {
  const remaining = Object.fromEntries(
    Object.entries(highlights[scope] ?? {}).filter(([, fieldToken]) => fieldToken !== token)
  );
  if (Object.keys(remaining).length > 0) {
    return { ...highlights, [scope]: remaining };
  }
  return Object.fromEntries(Object.entries(highlights).filter(([key]) => key !== scope));
};

/**
 * Fields recently changed by a callout, shown with a brief highlight. Each callout gets a new
 * token, so a field changed again before its highlight ends restarts the fade instead of
 * being cleared by the previous callout's timer.
 */
export const useCalloutHighlightStore = create<CalloutHighlightStore>()(
  devtools(
    (set) => ({
      highlights: {},
      highlightFields: (scope, fieldNames) => {
        if (fieldNames.length === 0) {
          return;
        }
        lastToken += 1;
        const token = lastToken;
        const added = Object.fromEntries(fieldNames.map((fieldName) => [fieldName, token]));
        set(
          (state) => ({ highlights: { ...state.highlights, [scope]: { ...state.highlights[scope], ...added } } }),
          false,
          "calloutHighlight/highlightFields"
        );
        setTimeout(() => {
          set(
            (state) => ({ highlights: withoutToken(state.highlights, scope, token) }),
            false,
            "calloutHighlight/clearFields"
          );
        }, CALLOUT_HIGHLIGHT_DURATION_MS);
      },
    }),
    { name: "CalloutHighlightStore" }
  )
);

/** Token of the active highlight of a field, or `undefined` when it is not highlighted. */
export const useCalloutHighlightToken = (scope: string, fieldName: string): number | undefined =>
  useCalloutHighlightStore((state) => state.highlights[scope]?.[fieldName]);
