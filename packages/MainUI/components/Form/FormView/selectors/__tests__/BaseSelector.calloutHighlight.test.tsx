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

import { act, fireEvent, render } from "@testing-library/react";
import { FormProvider, useForm, useFormContext, type UseFormReturn } from "react-hook-form";
import { BaseSelector } from "@/components/Form/FormView/selectors/BaseSelector";
import { FormInitializationProvider } from "@/contexts/FormInitializationContext";
import { useCalloutHighlightStore } from "@/stores/calloutHighlightStore";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { FORM_FIELD_NAME_ATTRIBUTE } from "@/utils/form/focus";
import { getFormHighlightScope } from "@/utils/callouts/calloutHighlight";

const TAB_ID = "TAB1";
const PRODUCT = "product";
const PRICE = "priceActual";
const TAX = "tax";
const ACTIVE = "active";
const TAX_ID = "TAX1";

const tabField = (hqlName: string, columnName: string, reference: string) => ({
  hqlName,
  columnName,
  inputName: `inp${columnName}`,
  name: hqlName,
  column: { reference },
});

const TRIGGER_FIELD = {
  ...tabField(PRODUCT, "M_Product_ID", FIELD_REFERENCE_CODES.STRING.id),
  column: { reference: FIELD_REFERENCE_CODES.STRING.id, callout: "SL_Product" },
  isMandatory: false,
  displayed: true,
  readOnlyLogicExpression: "",
};

const mockTab = {
  id: TAB_ID,
  table: "TBL",
  window: "WIN",
  entityName: "OrderLine",
  fields: {
    id: tabField("id", "C_OrderLine_ID", FIELD_REFERENCE_CODES.STRING.id),
    [PRODUCT]: TRIGGER_FIELD,
    [PRICE]: tabField(PRICE, "PriceActual", FIELD_REFERENCE_CODES.STRING.id),
    [TAX]: tabField(TAX, "C_Tax_ID", FIELD_REFERENCE_CODES.TABLE_DIR_19.id),
    [ACTIVE]: tabField(ACTIVE, "IsActive", FIELD_REFERENCE_CODES.BOOLEAN.id),
  },
};

const mockCalloutResponse = {
  columnValues: {
    PriceActual: { value: "12.5" },
    C_Tax_ID: { value: TAX_ID, identifier: "Tax 1" },
    IsActive: { value: "Y" },
    Unknown_Column: { value: "X" },
  },
  auxiliaryInputValues: { AUX_VALUE: { value: "A" } },
};

jest.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => ({ get: jest.fn(), forEach: jest.fn() }),
}));
jest.mock("@/hooks/useDisplayLogic", () => ({ __esModule: true, default: () => true }));
jest.mock("@/hooks/useFormParent", () => ({ __esModule: true, default: () => ({}) }));
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { session: Record<string, unknown> }) => unknown) => selector({ session: {} }),
}));
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ tab: mockTab, setAuxiliaryInputs: jest.fn() }),
}));
jest.mock("@/hooks/useCallout", () => ({
  useCallout: () => async () => mockCalloutResponse,
}));
jest.mock("@/components/Form/FormView/selectors/GenericSelector", () => ({
  GenericSelector: () => <input data-testid="generic-selector" />,
}));

let formMethods: UseFormReturn;

const FormMethodsSpy = () => {
  formMethods = useFormContext();
  return null;
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: { [PRODUCT]: "", [PRICE]: 10, [TAX]: TAX_ID, [ACTIVE]: true },
  });
  return (
    <FormInitializationProvider value={{ isFormInitializing: false }}>
      <FormProvider {...methods}>
        <FormMethodsSpy />
        {children}
      </FormProvider>
    </FormInitializationProvider>
  );
};

const runProductCallout = async (container: HTMLElement) => {
  act(() => formMethods.setValue(PRODUCT, "PROD1", { shouldDirty: true }));
  const fieldContainer = container.querySelector(`[${FORM_FIELD_NAME_ATTRIBUTE}="${PRODUCT}"]`) as HTMLElement;
  await act(async () => {
    fireEvent.blur(fieldContainer);
  });
  // The callout manager resumes in a timeout once the values are applied
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
};

const getFormHighlights = () => useCalloutHighlightStore.getState().highlights[getFormHighlightScope(TAB_ID)];

describe("BaseSelector callout highlight", () => {
  beforeEach(() => {
    useCalloutHighlightStore.setState({ highlights: {} });
  });

  it("highlights only the known fields whose value the callout changed", async () => {
    const { container } = render(
      <Wrapper>
        <BaseSelector field={TRIGGER_FIELD as never} />
      </Wrapper>
    );

    await runProductCallout(container);

    expect(Object.keys(getFormHighlights())).toEqual([PRICE]);
  });

  it("keeps applying the callout values, converting the boolean reference", async () => {
    const { container } = render(
      <Wrapper>
        <BaseSelector field={TRIGGER_FIELD as never} />
      </Wrapper>
    );

    await runProductCallout(container);

    expect(formMethods.getValues(PRICE)).toBe("12.5");
    expect(formMethods.getValues(ACTIVE)).toBe(true);
    expect(formMethods.getValues(`${TAX}$_identifier`)).toBe("Tax 1");
    expect(formMethods.getValues("Unknown_Column")).toBe("X");
  });

  it("renders the highlight next to the field it belongs to", async () => {
    const { container } = render(
      <Wrapper>
        <BaseSelector field={TRIGGER_FIELD as never} />
      </Wrapper>
    );

    act(() => useCalloutHighlightStore.getState().highlightFields(getFormHighlightScope(TAB_ID), [PRODUCT]));

    const overlay = container.querySelector(".callout-highlight-overlay");
    expect(overlay?.parentElement).toHaveClass("relative");
    expect(overlay?.parentElement?.querySelector('[data-testid="generic-selector"]')).not.toBeNull();
  });
});
