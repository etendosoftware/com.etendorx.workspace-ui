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

import CTABanner from "./widgets/CTABanner";
import RecentDocumentsWidget from "./widgets/RecentDocumentsWidget";
import RecentlyViewedWidget from "./widgets/RecentlyViewedWidget";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 w-full h-full overflow-y-auto p-4">
      <CTABanner data-testid="CTABanner__dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentDocumentsWidget data-testid="RecentDocumentsWidget__dashboard" />
        <RecentlyViewedWidget data-testid="RecentlyViewedWidget__dashboard" />
      </div>
    </div>
  );
}
