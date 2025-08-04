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

import MenuClose from "../../../assets/icons/menu-close.svg";
import MenuOpen from "../../../assets/icons/menu-open.svg";
import IconButton from "../../IconButton";
import Logo from "../../Logo";
import type { DrawerHeaderProps } from "../types";

const DrawerHeader = ({ title, logo, open, onClick, tabIndex }: DrawerHeaderProps) => {
  return (
    <div className="h-14 min-h-14 flex items-center justify-end p-2 border-b border-(--color-transparent-neutral-10)">
      {open && (
        <div className="w-full">
          <a href="/" className="flex items-center gap-1" title="Etendo">
            <Logo logo={logo} title={title} />
            <span className="font-semibold text-(--color-baseline-neutral-90) text-base">{title}</span>
          </a>
        </div>
      )}
      <div>
        <IconButton onClick={onClick} className="h-9 w-9" tabIndex={tabIndex}>
          {open ? <MenuClose /> : <MenuOpen />}
        </IconButton>
      </div>
    </div>
  );
};

export default DrawerHeader;
