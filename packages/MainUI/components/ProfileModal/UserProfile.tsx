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

import { useCallback } from "react";
import Image from "next/image";
import { useStyle, TEXT_LOGO } from "./styles";
import BackgroundGradient from "../../../ComponentLibrary/src/assets/images/backgroundGradient.svg?url";
import LogoutIcon from "../../../ComponentLibrary/src/assets/icons/log-out.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import type { UserProfileProps } from "./types";

const UserProfile: React.FC<UserProfileProps> = ({ photoUrl, name, onSignOff }) => {
  const { styles } = useStyle();

  const handleSignOff = useCallback(() => {
    onSignOff();
  }, [onSignOff]);

  return (
    <div style={styles.userProfileStyles}>
      <div style={styles.svgContainerStyles}>
        <Image
          src={BackgroundGradient}
          height={window.innerHeight}
          width={window.innerWidth}
          alt="Background Gradient"
        />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <IconButton tooltip="Log out" onClick={handleSignOff} className="h-6 w-6 [&>svg]:w-4 [&>svg]:h-4">
          <LogoutIcon />
        </IconButton>
      </div>
      <div style={styles.profileImageContainerStyles}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            height={window.innerHeight}
            width={window.innerWidth}
            alt="Profile"
            style={styles.profileImageStyles}
          />
        ) : (
          <div
            style={{
              ...styles.profileImageStyles,
              ...styles.profileWithoutImage,
            }}>
            {TEXT_LOGO}
          </div>
        )}
      </div>
      {/* <p style={styles.nameStyles}>{name}</p> */}
      <div style={styles.profileDetailsStyles}>
        <p style={styles.emailStyles}>{name}</p>
      </div>
    </div>
  );
};

export default UserProfile;
