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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * While a typed term waits for its debounced server search, or the search is loading, the dropdown shows that it is
 * loading. "No options found" only follows a finished search without matches (ETP-6431).
 */
import { act, render, screen } from "@testing-library/react";
import { openSelectDropdown, SelectHarness, typeInSelectSearch } from "../../../__testHelpers__/selectTestHarness";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

const LOADING = "common.loading";
const NO_OPTIONS = "multiselect.noOptionsFound";
const SEARCH_DEBOUNCE_MS = 500;
const MIN_SEARCH_CHARS = 3;

const runDebounce = () => {
  act(() => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });
};

describe("Select — loading while searching (ETP-6431)", () => {
  const onSearch = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    onSearch.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it("shows the loading text instead of 'No options found' while the typed term waits for its search", () => {
    render(<SelectHarness onSearch={onSearch} minSearchChars={MIN_SEARCH_CHARS} />);
    openSelectDropdown();

    typeInSelectSearch("zzz");

    expect(screen.getByText(LOADING)).toBeInTheDocument();
    expect(screen.queryByText(NO_OPTIONS)).not.toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("shows 'No options found' once the search finished without matches", () => {
    const { rerender } = render(<SelectHarness onSearch={onSearch} minSearchChars={MIN_SEARCH_CHARS} />);
    openSelectDropdown();
    typeInSelectSearch("zzz");

    runDebounce();
    rerender(<SelectHarness onSearch={onSearch} minSearchChars={MIN_SEARCH_CHARS} options={[]} />);

    expect(onSearch).toHaveBeenCalledWith("zzz");
    expect(screen.getByText(NO_OPTIONS)).toBeInTheDocument();
    expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
  });

  it("keeps the matching options and adds the loading row while their search is pending", () => {
    render(<SelectHarness onSearch={onSearch} minSearchChars={MIN_SEARCH_CHARS} />);
    openSelectDropdown();

    typeInSelectSearch("alp");

    expect(screen.getByTestId("OptionItem__2")).toBeInTheDocument();
    expect(screen.getByText(LOADING)).toBeInTheDocument();
  });

  it("shows the loading text while the server search runs", () => {
    render(<SelectHarness onSearch={onSearch} options={[]} loading />);
    openSelectDropdown();

    expect(screen.getByText(LOADING)).toBeInTheDocument();
  });

  it("never waits for a search on a term below the minimum, which shows the hint", () => {
    render(<SelectHarness onSearch={onSearch} minSearchChars={MIN_SEARCH_CHARS} />);
    openSelectDropdown();

    typeInSelectSearch("zz");

    expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
    expect(screen.getByText("form.select.minCharsHint")).toBeInTheDocument();
  });

  it("shows 'No options found' at once without a server search", () => {
    render(<SelectHarness />);
    openSelectDropdown();

    typeInSelectSearch("zzz");

    expect(screen.getByText(NO_OPTIONS)).toBeInTheDocument();
  });
});
