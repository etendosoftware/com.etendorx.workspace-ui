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