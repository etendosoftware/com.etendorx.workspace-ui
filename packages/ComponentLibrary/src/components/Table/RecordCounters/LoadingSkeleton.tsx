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

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  "data-testid"?: string;
}

/**
 * Simple loading skeleton component using Tailwind CSS
 * Replaces MUI Skeleton for better performance
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = 120,
  height = 20,
  className = "",
  "data-testid": testId,
}) => {
  const widthClass = typeof width === "number" ? `w-[${width}px]` : width;
  const heightClass = typeof height === "number" ? `h-[${height}px]` : height;

  return (
    <div
      data-testid={testId}
      className={`animate-pulse bg-gray-200 rounded ${widthClass} ${heightClass} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
};

export default LoadingSkeleton;
