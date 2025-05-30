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
        <IconButton onClick={handleSignOff} className="h-6 w-6 [&>svg]:w-4 [&>svg]:h-4">
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
