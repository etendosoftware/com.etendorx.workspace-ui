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
import { useState, useCallback, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import LocationIcon from "@workspaceui/componentlibrary/src/assets/icons/map-pin.svg";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import Button from "@mui/material/Button";
import type { LocationSelectorProps } from "../types";
import { TextInput } from "./components/TextInput";
import { useDatasource } from "@/hooks/useDatasource";
import { useLocation } from "@/hooks/useLocation";
import { useTranslation } from "@/hooks/useTranslation";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { LocationData, CountryOption, RegionOption } from "./LocationSelector/types";

const LocationSelector: React.FC<LocationSelectorProps> = ({ field, isReadOnly }) => {
  const { watch, setValue } = useFormContext();
  const { t } = useTranslation();
  const value = watch(field.hqlName);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { createLocation, loading: locationLoading, error: locationError } = useLocation();

  const [locationData, setLocationData] = useState<LocationData>({
    id: "",
    address1: "",
    address2: "",
    postal: "",
    city: "",
    countryId: "",
    regionId: "",
    _identifier: "",
  });

  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    const existingIdentifier = watch(`${field.hqlName}$_identifier`);

    if (existingIdentifier && !displayValue) {
      setDisplayValue(existingIdentifier);
    }

    if (value?.id && !locationData.id) {
      setLocationData({
        id: value.id || "",
        address1: value.address1 || "",
        address2: value.address2 || "",
        postal: value.postal || "",
        city: value.city || "",
        countryId: value.country || "",
        regionId: value.region || "",
        _identifier: value._identifier || "",
      });
    }
  }, [field.hqlName, watch, displayValue, locationData.id, value]);

  const {
    records: countryRecords,
    loading: loadingCountries,
    error: countryError,
  } = useDatasource({
    entity: "Country",
    skip: false,
  });

  const [shouldLoadRegions, setShouldLoadRegions] = useState(false);
  const [regionEntity, setRegionEntity] = useState<string>("");

  useEffect(() => {
    if (locationData.countryId && !shouldLoadRegions) {
      setShouldLoadRegions(true);
      setRegionEntity("Region");
    } else if (!locationData.countryId && shouldLoadRegions) {
      setShouldLoadRegions(false);
      setRegionEntity("");
    }
  }, [locationData.countryId, shouldLoadRegions]);

  const {
    records: regionRecords,
    loading: loadingRegions,
    error: regionError,
  } = useDatasource({
    entity: regionEntity,
    skip: !shouldLoadRegions,
  });

  const countries = useMemo((): CountryOption[] => {
    if (!countryRecords) return [];
    return countryRecords.map((country: EntityData) => ({
      id: String(country.id || ""),
      title: String(country._identifier || country.name || country.id || ""),
      value: String(country.id || ""),
    }));
  }, [countryRecords]);

  const regions = useMemo((): RegionOption[] => {
    if (!regionRecords || !locationData.countryId) return [];
    return regionRecords
      .filter((region: EntityData) => region.country === locationData.countryId)
      .map((region: EntityData) => ({
        id: String(region.id || ""),
        title: String(region._identifier || region.name || region.id || ""),
        value: String(region.id || ""),
      }));
  }, [regionRecords, locationData.countryId]);

  useEffect(() => {
    if (!value && displayValue) {
      setDisplayValue("");
    }
  }, [value, displayValue]);

  const handleOpenModal = useCallback(() => {
    if (isReadOnly) return;
    setIsModalOpen(true);
  }, [isReadOnly]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    const existingData = watch(`${field.hqlName}`);
    if (existingData?.id) {
      setLocationData({
        id: existingData.id || "",
        address1: existingData.address1 || "",
        address2: existingData.address2 || "",
        postal: existingData.postal || "",
        city: existingData.city || "",
        countryId: existingData.country || "",
        regionId: existingData.region || "",
        _identifier: existingData._identifier || "",
      });
    } else {
      setLocationData({
        id: "",
        address1: "",
        address2: "",
        postal: "",
        city: "",
        countryId: "",
        regionId: "",
        _identifier: "",
      });
    }
  }, [field.hqlName, watch]);

  const handleCountryChange = useCallback((_event: React.SyntheticEvent, newValue: CountryOption | null) => {
    setLocationData((prev) => ({
      ...prev,
      countryId: newValue?.value || "",
      regionId: "",
    }));
  }, []);

  const handleRegionChange = useCallback((_event: React.SyntheticEvent, newValue: RegionOption | null) => {
    setLocationData((prev) => ({
      ...prev,
      regionId: newValue?.value || "",
    }));
  }, []);

  const handleInputChange = useCallback((fieldName: keyof LocationData, value: string) => {
    setLocationData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  const selectedCountry = useMemo(() => {
    return countries.find((country) => country.value === locationData.countryId) || null;
  }, [countries, locationData.countryId]);

  const selectedRegion = useMemo(() => {
    return regions.find((region) => region.value === locationData.regionId) || null;
  }, [regions, locationData.regionId]);

  const countrySelect = useMemo(() => {
    if (loadingCountries) {
      return (
        <div className="flex items-center justify-center p-4">
          <Spinner data-testid="Spinner__e401ac" />
        </div>
      );
    }

    if (countryError) {
      return <div className="text-red-500 text-sm">{t("location.errors.loadingCountries")}</div>;
    }

    return (
      <Select
        options={countries}
        value={selectedCountry}
        onChange={handleCountryChange}
        id="country-select"
        disabled={locationLoading}
        data-testid="Select__e401ac"
      />
    );
  }, [loadingCountries, countryError, countries, selectedCountry, handleCountryChange, locationLoading, t]);

  const regionSelect = useMemo(() => {
    if (!locationData.countryId) {
      return (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          {t("location.fields.region.selectCountryFirst")}
        </div>
      );
    }

    if (loadingRegions) {
      return (
        <div className="flex items-center justify-center p-4">
          <Spinner data-testid="Spinner__e401ac" />
        </div>
      );
    }

    if (regionError) {
      return <div className="text-red-500 text-sm">{t("location.errors.loadingRegions")}</div>;
    }

    return (
      <Select
        options={regions}
        value={selectedRegion}
        onChange={handleRegionChange}
        id="region-select"
        disabled={locationLoading}
        data-testid="Select__e401ac"
      />
    );
  }, [
    locationData.countryId,
    loadingRegions,
    regionError,
    regions,
    selectedRegion,
    handleRegionChange,
    locationLoading,
    t,
  ]);

  const isFormValid = useMemo(() => {
    return locationData.address1.trim() !== "" && locationData.city.trim() !== "" && locationData.countryId !== "";
  }, [locationData]);

  const handleSaveLocation = useCallback(async () => {
    if (!isFormValid || locationLoading) return;

    try {
      const createdLocation = await createLocation({
        address1: locationData.address1,
        address2: locationData.address2,
        postal: locationData.postal,
        city: locationData.city,
        countryId: locationData.countryId,
        regionId: locationData.regionId || undefined,
      });

      const locationId = createdLocation.id;
      const locationIdentifier = createdLocation._identifier;

      if (locationId) {
        setValue(field.hqlName, locationId);
        setValue(`${field.hqlName}$_identifier`, locationIdentifier);
        setValue(`${field.hqlName}_data`, {
          id: locationId,
          _identifier: locationIdentifier,
          _entityName: "Location",
          address1: createdLocation.address1,
          address2: createdLocation.address2,
          postal: createdLocation.postal,
          city: createdLocation.city,
          country: createdLocation.countryId,
          region: createdLocation.regionId || null,
        });

        setDisplayValue(locationIdentifier);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error(t("location.errors.creating"), error);
    }
  }, [isFormValid, locationLoading, locationData, createLocation, setValue, field.hqlName, t]);

  const combinedError = locationError || countryError || regionError;

  return (
    <>
      <div className="w-full">
        <div
          className={`flex items-center justify-between w-full h-10 px-3 border-b transition-colors ${
            isReadOnly ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer border-gray-300"
          }`}
          onClick={handleOpenModal}
          tabIndex={isReadOnly ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isReadOnly) {
              e.preventDefault();
              handleOpenModal();
            }
          }}>
          <div className="flex items-center gap-2">
            <SearchOutlined fill="#6B7280" className="w-4 h-4" data-testid="SearchOutlined__e401ac" />
            <span className={`text-sm ${displayValue ? "text-gray-900" : "text-gray-500"}`}>
              {displayValue || t("location.selector.placeholder")}
            </span>
          </div>
          {!isReadOnly && <LocationIcon fill="#9CA3AF" className="w-4 h-4" data-testid="LocationIcon__e401ac" />}
        </div>
      </div>
      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        tittleHeader={t("location.selector.modalTitle")}
        descriptionText={t("location.selector.modalDescription")}
        HeaderIcon={LocationIcon}
        showHeader
        buttons={
          <div className="flex gap-2">
            <Button
              variant="outlined"
              onClick={handleCloseModal}
              disabled={locationLoading}
              data-testid="Button__e401ac">
              {t("location.selector.buttons.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveLocation}
              disabled={!isFormValid || locationLoading}
              data-testid="Button__e401ac">
              {locationLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner data-testid="Spinner__e401ac" />
                  <span>{t("location.selector.buttons.creating")}</span>
                </div>
              ) : (
                t("location.selector.buttons.save")
              )}
            </Button>
          </div>
        }
        data-testid="Modal__e401ac">
        <div className="space-y-4 p-4">
          {combinedError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{String(combinedError)}</p>
            </div>
          )}

          {!isFormValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-600">{t("location.errors.requiredFields")}</p>
            </div>
          )}

          <TextInput
            label={t("location.fields.address1.label")}
            field={{
              ...field,
              isMandatory: true,
              name: "address1",
              hqlName: "address1",
            }}
            value={locationData.address1}
            onChange={(e) => handleInputChange("address1", e.target.value)}
            placeholder={t("location.fields.address1.placeholder")}
            maxLength={60}
            className="w-full"
            data-testid="TextInput__e401ac"
          />

          <TextInput
            label={t("location.fields.address2.label")}
            field={{
              ...field,
              isMandatory: false,
              name: "address2",
              hqlName: "address2",
            }}
            value={locationData.address2}
            onChange={(e) => handleInputChange("address2", e.target.value)}
            placeholder={t("location.fields.address2.placeholder")}
            maxLength={60}
            className="w-full"
            data-testid="TextInput__e401ac"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label={t("location.fields.postal.label")}
              field={{
                ...field,
                isMandatory: false,
                name: "postal",
                hqlName: "postal",
              }}
              value={locationData.postal}
              onChange={(e) => handleInputChange("postal", e.target.value)}
              placeholder={t("location.fields.postal.placeholder")}
              maxLength={10}
              className="w-full"
              data-testid="TextInput__e401ac"
            />
            <TextInput
              label={t("location.fields.city.label")}
              field={{
                ...field,
                isMandatory: true,
                name: "city",
                hqlName: "city",
              }}
              value={locationData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder={t("location.fields.city.placeholder")}
              maxLength={60}
              className="w-full"
              data-testid="TextInput__e401ac"
            />
          </div>

          <div>
            <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">
              {t("location.fields.country.label")} *
            </label>
            {countrySelect}
          </div>

          <div>
            <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 mb-1">
              {t("location.fields.region.label")}
            </label>
            {regionSelect}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LocationSelector;
