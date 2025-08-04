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

import type React from "react";
import { type ReactNode, useCallback, useState } from "react";
import RightButtons from "./RigthComponents/RightButtons";
import SearchInputWithVoice from "../Input/TextInput/TextInputAutocomplete/SearchInputWithVoice";
import { useStyle } from "./Nav.styles";
export interface NavProps {
  children?: ReactNode;
  searchDisabled?: boolean;
  title?: string;
}

const Nav: React.FC<NavProps> = ({ children, searchDisabled = true, title }) => {
  const { styles } = useStyle();
  const [value, setValue] = useState("");
  const handleVoiceClick = useCallback(() => alert("Voice activated"), []);

  return (
    <nav style={styles.NavStyles}>
      <div style={styles.LeftItems} title={title}>
        <SearchInputWithVoice
          value={value}
          setValue={setValue}
          placeholder="Search"
          onVoiceClick={handleVoiceClick}
          disabled={searchDisabled}
        />
      </div>
      <div style={styles.RightItems}>
        <RightButtons>{children}</RightButtons>
      </div>
    </nav>
  );
};

export default Nav;
