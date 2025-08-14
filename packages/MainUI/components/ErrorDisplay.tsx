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

import Image from "next/image";
import { Button } from "@mui/material";
import { useTranslation } from "../hooks/useTranslation";
import errorImage from "../../ComponentLibrary/src/assets/images/NotificationModal/empty-state-notifications.svg?url";
import Link from "next/link";
import type { ErrorDisplayProps } from "./types";

export function ErrorDisplay({
  title,
  description,
  showRetry = false,
  onRetry,
  showHomeButton = false,
  children,
}: ErrorDisplayProps & { children?: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md p-8 mx-auto bg-white rounded-lg shadow-md flex flex-col items-center">
      <div className="mb-6 max-w-xs">
        <Image src={errorImage} width={240} height={240} alt="Error" className="mx-auto" priority />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-3 text-center">{title}</h2>
      {description && <p className="text-gray-600 mb-6 text-center">{description}</p>}
      {children}
      <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full justify-center">
        {showRetry && onRetry && (
          <Button
            variant="contained"
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
            {t("errors.internalServerError.retry")}
          </Button>
        )}
        {showHomeButton && (
          <Link href="/">
            <Button variant="contained" className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md">
              {t("navigation.common.home")}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
