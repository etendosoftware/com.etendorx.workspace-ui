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

import Link from "next/link";
import { Button } from "@mui/material";
import { getLanguage, t } from "@/utils/language";
import { ErrorDisplay } from "@/components/ErrorDisplay";

export default function NotFound() {
  const language = getLanguage();

  return (
    <div className="w-full min-h-full flex items-center justify-center">
      <ErrorDisplay
        title={t(language, "errors.notFound.title")}
        description={t(language, "errors.notFound.description")}>
        <Link href="/">
          <Button variant="contained">{t(language, "navigation.common.home")}</Button>
        </Link>
      </ErrorDisplay>
    </div>
  );
}
