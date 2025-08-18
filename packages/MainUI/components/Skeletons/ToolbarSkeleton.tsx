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

/**
 * Loading skeleton component for the Toolbar
 * Shows animated placeholder elements while toolbar data is being fetched
 */
const ToolbarSkeleton: React.FC = () => {
  return (
    <div className="h-10 flex justify-between items-center gap-1 animate-pulse">
      {/* Left section skeleton */}
      <div className="bg-(--color-baseline-0) rounded-4xl p-1 flex items-center gap-2">
        <div className="h-6 w-20 bg-(--color-transparent-neutral-10) rounded" />
        <div className="h-6 w-16 bg-(--color-transparent-neutral-10) rounded" />
      </div>
      
      {/* Center section skeleton */}
      <div className="bg-(--color-baseline-0) rounded-4xl p-1 flex-1 flex items-center gap-2 shadow-[0px_4px_10px_var(--color-transparent-neutral-10)]">
        <div className="h-6 w-24 bg-(--color-transparent-neutral-10) rounded" />
        <div className="h-6 w-32 bg-(--color-transparent-neutral-10) rounded" />
        <div className="h-6 w-20 bg-(--color-transparent-neutral-10) rounded" />
      </div>
      
      {/* Right section skeleton */}
      <div className="bg-transparent-neutral-5 rounded-4xl p-1 flex items-center gap-2">
        <div className="h-6 w-6 bg-(--color-transparent-neutral-10) rounded-full" />
        <div className="h-6 w-6 bg-(--color-transparent-neutral-10) rounded-full" />
      </div>
    </div>
  );
};

export default ToolbarSkeleton;
