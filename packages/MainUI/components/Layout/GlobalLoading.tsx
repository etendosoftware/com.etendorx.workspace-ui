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

import Loading from "@/components/loading";
import { useLoading } from "@/contexts/loading";

export default function GlobalLoading() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <Loading
      className="h-screen w-screen absolute z-100 bg-black/25"
      customIconProps={{
        size: 60,
        thickness: 4,
        sx: {
          color: "#1976d2",
        },
      }}
    />
  );
}
