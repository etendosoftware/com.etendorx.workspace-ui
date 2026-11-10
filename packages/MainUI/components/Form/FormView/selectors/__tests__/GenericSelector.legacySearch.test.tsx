import { render } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { GenericSelector } from "../GenericSelector";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }));
jest.mock("@/app/actions/revalidate", () => ({ revalidateDopoProcess: jest.fn() }));
jest.mock("react-hook-form");

jest.mock("../SelectSelector", () => ({ SelectSelector: () => <div data-testid="SelectSelector" /> }));
jest.mock("../SelectorModal", () => ({ __esModule: true, default: () => <div data-testid="SelectorModal" /> }));
jest.mock("@/components/ProcessModal/ProcessDefinitionModal", () => ({ __esModule: true, default: () => null }));
jest.mock("@/hooks/useProcessDefinitionTrigger", () => ({
  useProcessDefinitionTrigger: jest.fn(() => ({
    isProcessModalOpen: false,
    processButtonData: null,
    isLoading: false,
    triggerProcess: jest.fn(),
    closeProcessModal: jest.fn(),
  })),
}));
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({ Metadata: { client: { post: jest.fn() } } }));
jest.mock("@/utils/form/selectors/utils", () => ({
  getSelectorFieldName: jest.fn((field) => field.hqlName || field.name),
  updateSelectorValue: jest.fn(),
  writeCallerRecord: jest.fn(),
}));

// The popup itself is covered by LegacySelectorAffix.test.tsx: here only whether a field gets it.
jest.mock("@/components/ProcessModal/selectors/LegacySelectorAffix", () => ({
  __esModule: true,
  default: ({ legacySearchUrl, children }: { legacySearchUrl: string; children: React.ReactNode }) => (
    <div data-testid="LegacySelectorAffix" data-url={legacySearchUrl}>
      {children}
    </div>
  ),
}));

const LOCATOR_URL = "/info/Locator.html";

const makeField = (selector: Record<string, unknown>) =>
  ({ id: "f1", hqlName: "storageBin", column: { reference: "30" }, selector }) as never;

describe("GenericSelector legacy Search popup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({ getValues: jest.fn(() => ({})), setValue: jest.fn() });
  });

  it("wraps a Search field that only has a Classic popup (e.g. Storage Bin) with the popup button", () => {
    const { getByTestId } = render(
      <GenericSelector field={makeField({ legacySearchUrl: LOCATOR_URL })} isReadOnly={false} />
    );

    expect(getByTestId("LegacySelectorAffix")).toHaveAttribute("data-url", LOCATOR_URL);
    expect(getByTestId("SelectSelector")).toBeInTheDocument();
  });

  it("keeps the native picker of a field that already has one", () => {
    const { queryByTestId } = render(
      <GenericSelector field={makeField({ legacySearchUrl: LOCATOR_URL, hasTableRelated: true })} isReadOnly={false} />
    );

    expect(queryByTestId("LegacySelectorAffix")).not.toBeInTheDocument();
  });

  it("adds nothing to a field without a Classic popup", () => {
    const { queryByTestId } = render(<GenericSelector field={makeField({})} isReadOnly={false} />);

    expect(queryByTestId("LegacySelectorAffix")).not.toBeInTheDocument();
  });
});
