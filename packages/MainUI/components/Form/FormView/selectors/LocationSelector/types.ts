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

import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";

export interface LocationData {
  id: string;
  address1: string;
  address2: string;
  postal: string;
  city: string;
  countryId: string;
  regionId: string;
  _identifier: string;
}

export interface CountryOption extends Option {
  id: string;
  title: string;
  value: string;
}

export interface RegionOption extends Option {
  id: string;
  title: string;
  value: string;
}

export interface LocationFormData {
  address1: string;
  address2: string;
  postal: string;
  city: string;
  countryId: string;
  regionId?: string;
}
