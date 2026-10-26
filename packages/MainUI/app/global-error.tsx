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

import "./styles/global.css";
import { ErrorRecoveryScreen } from "@/components/ErrorRecoveryScreen";

/**
 * Last-resort boundary for errors thrown by the root layout or its providers, which `error.tsx`
 * cannot catch. It replaces the whole document, so it renders its own html/body.
 */
export default function GlobalError({ error }: Readonly<{ error: Error & { digest?: string } }>) {
  return (
    <html lang="en">
      <body>
        <ErrorRecoveryScreen error={error} />
      </body>
    </html>
  );
}
