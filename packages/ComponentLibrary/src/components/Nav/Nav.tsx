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
