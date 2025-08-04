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
    <div className="flex flex-col items-center justify-center h-[9.5rem]">
      <img src={BackgroundGradient} className={"absolute h-[9.5rem]"} alt="Background Gradient" />
      <div className="top-4 right-4 z-10 absolute">
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
            className="w-full h-full rounded-full relative z-[2]"
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
      <p className="font-medium text-base leading-6 tracking-[0] font-inter mt-[0.75rem]">{name}</p>
    </div>
  );
};

export default UserProfile;
