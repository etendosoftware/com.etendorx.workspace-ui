import { render, screen, fireEvent, act } from "@testing-library/react";
import type React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import LegacySelectorAffix from "../LegacySelectorAffix";
import { LEGACY_ACTIONS, LEGACY_MESSAGE_TYPE } from "../../legacyMessageProtocol";

jest.mock("@/hooks/useUserContext", () => ({ useUserContext: () => ({ token: "tok" }) }));
jest.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => ({ config: { etendoClassicHost: "https://host" } }),
}));
// The shared IconButton mock drops onClick; override it here so the search button
// actually opens the popup when clicked.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({ onClick, children }: { onClick?: () => void; children?: React.ReactNode }) => (
    <button type="button" data-testid="icon-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

const FIELD_ID = "f1";
const FIELD_NAME = "product";
const LEGACY_URL = "/info/Product.html";
const PRODUCT_ID = "P1";
const PRODUCT_LABEL = "Product One";

const buildField = (): Field =>
  ({
    id: FIELD_ID,
    hqlName: FIELD_NAME,
    columnName: "M_Product_ID",
    name: "Product",
  }) as unknown as Field;

/** Exposes the form so assertions can read the values the affix writes.
 * Uses useWatch so it re-renders when the affix calls setValue. */
const FormProbe = () => {
  const values = useWatch();
  return <span data-testid="probe">{JSON.stringify(values)}</span>;
};

const renderAffix = (isReadOnly = false, defaultValues: Record<string, unknown> = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({ defaultValues });
    return (
      <FormProvider {...methods}>
        {children}
        <FormProbe />
      </FormProvider>
    );
  };
  return render(
    <Wrapper>
      <LegacySelectorAffix field={buildField()} legacySearchUrl={LEGACY_URL} isReadOnly={isReadOnly}>
        <select data-testid="combo" />
      </LegacySelectorAffix>
    </Wrapper>
  );
};

const readValues = (): Record<string, unknown> => JSON.parse(screen.getByTestId("probe").textContent || "{}");

const postSelectorMessage = async (action: string, id: string, identifier: string) => {
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: LEGACY_MESSAGE_TYPE,
          action: LEGACY_ACTIONS.SELECTOR_VALUE_PICKED,
          payload: { action, id, identifier },
        },
      })
    );
  });
};

describe("LegacySelectorAffix", () => {
  let fakePopup: { close: jest.Mock };
  let openSpy: jest.Mock;

  beforeEach(() => {
    fakePopup = { close: jest.fn() };
    openSpy = jest.fn(() => fakePopup);
    window.open = openSpy as unknown as typeof window.open;
  });

  it("renders the wrapped selector plus a search button", () => {
    renderAffix();

    expect(screen.getByTestId("combo")).toBeInTheDocument();
    expect(screen.getByTestId("icon-button")).toBeInTheDocument();
  });

  it("does not render the search button when read-only", () => {
    renderAffix(true);

    expect(screen.queryByTestId("icon-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("combo")).toBeInTheDocument();
  });

  it("opens a window with the legacy forward URL, command, current id and token", () => {
    renderAffix(false, { [FIELD_NAME]: "current-id" });

    fireEvent.click(screen.getByTestId("icon-button"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain("https://host/meta/legacy/info/Product.html");
    expect(url).toContain("Command=DEFAULT");
    expect(url).toContain("inpIDValue=current-id");
    expect(url).toContain("token=tok");
  });

  it("writes the picked id and identifier into the form and closes the popup on save", async () => {
    renderAffix();

    fireEvent.click(screen.getByTestId("icon-button"));
    await postSelectorMessage("SAVE", PRODUCT_ID, PRODUCT_LABEL);

    const values = readValues();
    expect(values[FIELD_NAME]).toBe(PRODUCT_ID);
    expect(values[`${FIELD_NAME}$_identifier`]).toBe(PRODUCT_LABEL);
    expect(fakePopup.close).toHaveBeenCalled();
  });

  it("closes the popup without writing when cleared", async () => {
    renderAffix();

    fireEvent.click(screen.getByTestId("icon-button"));
    await postSelectorMessage("CLEAR", "", "");

    expect(readValues()[FIELD_NAME]).toBeUndefined();
    expect(fakePopup.close).toHaveBeenCalled();
  });

  it("ignores unrelated messages", async () => {
    renderAffix();

    fireEvent.click(screen.getByTestId("icon-button"));
    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", { data: { type: "other", action: "foo" } }));
    });

    expect(readValues()[FIELD_NAME]).toBeUndefined();
    expect(fakePopup.close).not.toHaveBeenCalled();
  });
});
