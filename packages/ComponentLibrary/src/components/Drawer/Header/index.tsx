"use client";

import MenuClose from "../../../assets/icons/menu-close.svg";
import MenuOpen from  "../../../assets/icons/menu-open.svg";
import IconButton from "../../IconButton";
import type { DrawerHeaderProps } from "../types";

const DrawerHeader = ({ title, logo, open, onClick, tabIndex }: DrawerHeaderProps) => {
  const Logo = () => {
    const commonClasses = "w-9 h-9";
    if (typeof logo === "string") {
      return <img src={logo} className={commonClasses} alt={`${title} Logo`} />;
    }
    return <div className={commonClasses}>{logo}</div>;
  };

  return (
    <div className="h-14 flex items-center justify-end p-2 border-b border-(--color-transparent-neutral-10)">
      {open && (
        <div className="w-full">
          <a href="/" className="flex items-center gap-1" title="Etendo">
            <Logo />
            <span className="font-semibold text-[--color-baseline-neutral-90] text-base">
              {title}
            </span>
          </a>
        </div>
      )}
      <IconButton onClick={onClick} className="animated-transform w-full max-w-9 h-9" tabIndex={tabIndex}>
        {open ? <MenuClose /> : <MenuOpen />}
      </IconButton>
    </div>
  );
};

export default DrawerHeader;
