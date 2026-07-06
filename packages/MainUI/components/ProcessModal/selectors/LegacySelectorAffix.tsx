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

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import SearchIcon from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useUserContext } from "@/hooks/useUserContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { getSelectorFieldName, updateSelectorValue } from "@/utils/form/selectors/utils";
import {
  SELECTOR_SAVE_ACTION,
  buildLegacySelectorUrl,
  openLegacySelectorPopup,
  parseSelectorPayload,
} from "./legacySelectorPopup";

interface LegacySelectorAffixProps {
  field: Field;
  /** Classic info-window URL emitted in the selector metadata. */
  legacySearchUrl: string;
  isReadOnly: boolean;
  /** The underlying selector control (combo) wrapped by the search button. */
  children: ReactNode;
}

/**
 * Wraps a process-parameter selector with a search button that opens the Classic selector
 * popup in a separate window (via {@code window.open}, like manual processes and reports)
 * and writes the picked record back into the process form. The popup posts the chosen
 * {@code {id, identifier}} back via a backend-injected shim; this component listens for it.
 */
const LegacySelectorAffix = ({ field, legacySearchUrl, isReadOnly, children }: LegacySelectorAffixProps) => {
  const { getValues, setValue } = useFormContext();
  const { token } = useUserContext();
  const { config } = useRuntimeConfig();
  const publicHost = config?.etendoClassicHost || "";
  const popupRef = useRef<Window | null>(null);
  const fieldName = getSelectorFieldName(field);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = parseSelectorPayload(event.data);
      if (!message) {
        return;
      }
      if (message.action === SELECTOR_SAVE_ACTION && message.id) {
        updateSelectorValue(setValue, fieldName, message.id, { id: message.id, _identifier: message.identifier });
      }
      popupRef.current?.close();
      popupRef.current = null;
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setValue, fieldName]);

  const handleOpen = useCallback(() => {
    const currentValue = getValues(fieldName);
    const currentId = typeof currentValue === "string" ? currentValue : undefined;
    const url = buildLegacySelectorUrl({ publicHost, legacySearchUrl, currentId, token });
    popupRef.current = openLegacySelectorPopup(url);
  }, [getValues, fieldName, publicHost, legacySearchUrl, token]);

  if (isReadOnly) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full items-center gap-1">
      <div className="min-w-0 flex-grow">{children}</div>
      <IconButton
        onClick={handleOpen}
        className="h-8 w-8 flex-shrink-0"
        tooltip="Search"
        tooltipPosition="top"
        data-testid={`IconButton__${field.id}`}>
        <SearchIcon className="h-5 w-5 fill-current" data-testid={`SearchIcon__${field.id}`} />
      </IconButton>
    </div>
  );
};

export default LegacySelectorAffix;
