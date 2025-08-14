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

import type React from "react";
import { useCallback } from "react";
import { Box, Portal } from "@mui/material";
import TextInputAutocomplete from "@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete";
import { useStyle } from "./styles";
import type { SearchPortalProps } from "../types";

const SearchPortal: React.FC<SearchPortalProps> = ({
  isOpen,
  searchValue,
  onSearchChange,
  onClose,
  placeholder,
  autoCompleteTexts = [],
}) => {
  const { styles } = useStyle();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onClose();
        onSearchChange("");
      } else if (e.key === "Enter") {
        onClose();
      }
    },
    [onClose, onSearchChange]
  );

  const handleBlur = useCallback((): void => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <Box sx={styles.portal}>
        <TextInputAutocomplete
          value={searchValue}
          setValue={onSearchChange}
          placeholder={placeholder}
          autoCompleteTexts={autoCompleteTexts}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus={true}
        />
      </Box>
    </Portal>
  );
};

export default SearchPortal;
