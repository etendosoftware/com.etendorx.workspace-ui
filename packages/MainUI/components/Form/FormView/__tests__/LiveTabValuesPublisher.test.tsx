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

import { act, render } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import LiveTabValuesPublisher from "../LiveTabValuesPublisher";
import { FormInitializationProvider } from "@/contexts/FormInitializationContext";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";

const WINDOW_IDENTIFIER = "win-122";
const COUNTRY_TAB_ID = "country";
let mockWindowIdentifier = WINDOW_IDENTIFIER;

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => mockWindowIdentifier,
}));

const countryTab = {
  id: COUNTRY_TAB_ID,
  tabLevel: 0,
  parentColumns: [],
  fields: {
    hasRegion: { hqlName: "hasRegion", columnName: "HasRegion" },
    name: { hqlName: "name", columnName: "Name" },
  } as unknown as Record<string, Field>,
} as unknown as Tab;

const createChildTab = (displayLogic?: string) =>
  ({ id: "region", tabLevel: 1, parentTabId: COUNTRY_TAB_ID, displayLogic, fields: {} }) as unknown as Tab;

const SPAIN = { id: "ES", hasRegion: true, name: "Spain" };

interface HarnessProps {
  windowTabs: Tab[];
  isFormInitializing?: boolean;
  onForm: (form: UseFormReturn) => void;
}

const Harness = ({ windowTabs, isFormInitializing = false, onForm }: HarnessProps) => {
  const form = useForm({ defaultValues: SPAIN });
  onForm(form);
  return (
    <FormInitializationProvider value={{ isFormInitializing }}>
      <FormProvider {...form}>
        <LiveTabValuesPublisher tab={countryTab} windowTabs={windowTabs} />
      </FormProvider>
    </FormInitializationProvider>
  );
};

const renderPublisher = (windowTabs: Tab[], isFormInitializing = false) => {
  let form = {} as UseFormReturn;
  const view = render(
    <Harness
      windowTabs={windowTabs}
      isFormInitializing={isFormInitializing}
      onForm={(f) => {
        form = f;
      }}
    />
  );
  return { ...view, getForm: () => form };
};

const getPublished = () => useLiveTabValuesStore.getState().entries[WINDOW_IDENTIFIER]?.[COUNTRY_TAB_ID];

describe("LiveTabValuesPublisher", () => {
  const regionTab = createChildTab("@HasRegion@='Y'");

  beforeEach(() => {
    mockWindowIdentifier = WINDOW_IDENTIFIER;
    useLiveTabValuesStore.setState({ entries: {} });
  });

  it("publishes only the fields the child tabs' display logic reads", () => {
    renderPublisher([countryTab, regionTab]);

    expect(getPublished()).toEqual({ recordId: "ES", values: { hasRegion: true } });
  });

  it("publishes the new value when a referenced field is edited", () => {
    const { getForm } = renderPublisher([countryTab, regionTab]);

    act(() => getForm().setValue("hasRegion", false));

    expect(getPublished()?.values).toEqual({ hasRegion: false });
  });

  it("publishes the persisted values again after a discard resets the form", () => {
    const { getForm } = renderPublisher([countryTab, regionTab]);

    act(() => getForm().setValue("hasRegion", false));
    act(() => getForm().reset(SPAIN));

    expect(getPublished()?.values).toEqual({ hasRegion: true });
  });

  it("clears the values when the form holds no saved record", () => {
    const { getForm } = renderPublisher([countryTab, regionTab]);

    act(() => getForm().reset({ id: "", hasRegion: false, name: "" }));

    expect(getPublished()).toBeUndefined();
  });

  it("clears the values when unmounted", () => {
    const { unmount } = renderPublisher([countryTab, regionTab]);

    unmount();

    expect(getPublished()).toBeUndefined();
  });

  it("does not publish while the form is initializing", () => {
    renderPublisher([countryTab, regionTab], true);

    expect(getPublished()).toBeUndefined();
  });

  it.each([
    ["no child tab has display logic", [countryTab, createChildTab()]],
    ["there are no window tabs", undefined],
  ])("publishes nothing when %s", (_case, windowTabs) => {
    renderPublisher(windowTabs as Tab[]);

    expect(useLiveTabValuesStore.getState().entries).toEqual({});
  });

  it("publishes nothing outside a window", () => {
    mockWindowIdentifier = "";

    renderPublisher([countryTab, regionTab]);

    expect(useLiveTabValuesStore.getState().entries).toEqual({});
  });
});
