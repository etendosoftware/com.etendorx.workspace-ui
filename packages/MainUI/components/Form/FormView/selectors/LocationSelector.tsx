import type React from "react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import LocationIcon from "@workspaceui/componentlibrary/src/assets/icons/map-pin.svg";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { LocationSelectorProps } from "../types";
import { TextInput } from "./components/TextInput";
import { useDatasource } from "@/hooks/useDatasource";
import { useLocation } from "@/hooks/useLocation";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import Button from "@mui/material/Button";

interface LocationData {
  id: string;
  address1: string;
  address2: string;
  postal: string;
  city: string;
  countryId: string;
  regionId: string;
  _identifier: string;
}

interface CountryOption extends Option {
  id: string;
  title: string;
  value: string;
}

interface RegionOption extends Option {
  id: string;
  title: string;
  value: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ field, isReadOnly }) => {
  const { watch, setValue } = useFormContext();
  const value = watch(field.hqlName);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook personalizado para manejar la creación de direcciones
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

  // Cargar países usando el hook existente
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

  // Cargar regiones usando el hook existente
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
  }, []);

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

  const isFormValid = useMemo(() => {
    return locationData.address1.trim() !== "" && locationData.city.trim() !== "" && locationData.countryId !== "";
  }, [locationData]);

  const handleSaveLocation = useCallback(async () => {
    if (!isFormValid || locationLoading) return;

    try {
      // Crear la dirección usando el hook personalizado
      const createdLocation = await createLocation({
        address1: locationData.address1,
        address2: locationData.address2,
        postal: locationData.postal,
        city: locationData.city,
        countryId: locationData.countryId,
        regionId: locationData.regionId || undefined,
      });

      // Usar el ID y identifier devueltos por el backend
      const locationId = createdLocation.id;
      const locationIdentifier = createdLocation._identifier;

      if (locationId) {
        // Establecer el valor del campo con el ID de la ubicación creada
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
      console.error("Error creating location:", error);
      // El error ya está manejado por el hook useLocation
    }
  }, [isFormValid, locationLoading, locationData, createLocation, setValue, field.hqlName]);

  // Mostrar errores combinados
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
            <SearchOutlined fill="#6B7280" className="w-4 h-4" />
            <span className={`text-sm ${displayValue ? "text-gray-900" : "text-gray-500"}`}>
              {displayValue || "Select location..."}
            </span>
          </div>
          {!isReadOnly && <LocationIcon fill="#9CA3AF" className="w-4 h-4" />}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        tittleHeader="New Location"
        descriptionText="Enter location details"
        HeaderIcon={LocationIcon}
        showHeader
        buttons={
          <div className="flex gap-2">
            <Button variant="outlined" onClick={handleCloseModal} disabled={locationLoading}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveLocation} disabled={!isFormValid || locationLoading}>
              {locationLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span>Creating...</span>
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        }>
        <div className="space-y-4 p-4">
          {combinedError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{String(combinedError)}</p>
            </div>
          )}

          {!isFormValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-600">Please fill in all required fields correctly.</p>
            </div>
          )}

          {/* Address Line 1 */}
          <TextInput
            label="Address Line 1"
            field={{
              ...field,
              isMandatory: true,
              name: "address1",
              hqlName: "address1",
            }}
            value={locationData.address1}
            onChange={(e) => handleInputChange("address1", e.target.value)}
            placeholder="Enter address line 1"
            maxLength={60}
            className="w-full"
          />

          {/* Address Line 2 */}
          <TextInput
            label="Address Line 2"
            field={{
              ...field,
              isMandatory: false,
              name: "address2",
              hqlName: "address2",
            }}
            value={locationData.address2}
            onChange={(e) => handleInputChange("address2", e.target.value)}
            placeholder="Enter address line 2"
            maxLength={60}
            className="w-full"
          />

          {/* Postal Code and City */}
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Postal Code"
              field={{
                ...field,
                isMandatory: false,
                name: "postal",
                hqlName: "postal",
              }}
              value={locationData.postal}
              onChange={(e) => handleInputChange("postal", e.target.value)}
              placeholder="Enter postal code"
              maxLength={10}
              className="w-full"
            />
            <TextInput
              label="City"
              field={{
                ...field,
                isMandatory: true,
                name: "city",
                hqlName: "city",
              }}
              value={locationData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Enter city"
              maxLength={60}
              className="w-full"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            {loadingCountries ? (
              <div className="flex items-center justify-center p-4">
                <Spinner />
              </div>
            ) : countryError ? (
              <div className="text-red-500 text-sm">Error loading countries</div>
            ) : (
              <Select
                options={countries}
                value={selectedCountry}
                onChange={handleCountryChange}
                id="country-select"
                disabled={locationLoading}
              />
            )}
          </div>

          {/* Region */}
          <div>
            <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            {!locationData.countryId ? (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">Select a country first</div>
            ) : loadingRegions ? (
              <div className="flex items-center justify-center p-4">
                <Spinner />
              </div>
            ) : regionError ? (
              <div className="text-red-500 text-sm">Error loading regions</div>
            ) : (
              <Select
                options={regions}
                value={selectedRegion}
                onChange={handleRegionChange}
                id="region-select"
                disabled={locationLoading}
              />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LocationSelector;
