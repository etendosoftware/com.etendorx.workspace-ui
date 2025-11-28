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
import { useTranslation } from "@/hooks/useTranslation";

interface LoadingIndicatorProps {
  size?: "small" | "medium" | "large";
  message?: string;
  className?: string;
  inline?: boolean;
}

/**
 * Loading indicator component for save operations and other async actions
 * Provides visual feedback during loading states
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = "medium",
  message,
  className = "",
  inline = false,
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };

  const containerClasses = inline ? "inline-flex items-center gap-2" : "flex items-center justify-center gap-2";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-2
          border-gray-200
          border-t-blue-500
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label={message || t("common.loading")}
        data-testid="loader-icon"
      />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

export default LoadingIndicator;
