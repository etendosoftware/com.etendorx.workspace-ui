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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordNavigationControls } from "../RecordNavigationControls";

// Mock useTranslation
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("RecordNavigationControls", () => {
  const mockOnNext = jest.fn().mockResolvedValue(undefined);
  const mockOnPrevious = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render navigation controls with correct position", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={true}
        canNavigatePrevious={true}
        currentIndex={1}
        totalRecords={10}
        isNavigating={false}
      />
    );

    expect(screen.getByTestId("record-navigation-controls")).toBeInTheDocument();
    expect(screen.getByTestId("record-position-indicator")).toHaveTextContent("2 / 10");
  });

  it("should show '- / -' when no records available", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={false}
        canNavigatePrevious={false}
        currentIndex={-1}
        totalRecords={0}
        isNavigating={false}
      />
    );

    expect(screen.getByTestId("record-position-indicator")).toHaveTextContent("- / -");
  });

  it("should disable both buttons when no records", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={false}
        canNavigatePrevious={false}
        currentIndex={-1}
        totalRecords={0}
        isNavigating={false}
      />
    );

    const previousButton = screen.getByTestId("previous-record-button");
    const nextButton = screen.getByTestId("next-record-button");

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("should disable previous button at first record", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={true}
        canNavigatePrevious={false}
        currentIndex={0}
        totalRecords={10}
        isNavigating={false}
      />
    );

    const previousButton = screen.getByTestId("previous-record-button");
    const nextButton = screen.getByTestId("next-record-button");

    expect(previousButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("should disable next button at last record", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={false}
        canNavigatePrevious={true}
        currentIndex={9}
        totalRecords={10}
        isNavigating={false}
      />
    );

    const previousButton = screen.getByTestId("previous-record-button");
    const nextButton = screen.getByTestId("next-record-button");

    expect(previousButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("should call onNext when next button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={true}
        canNavigatePrevious={true}
        currentIndex={1}
        totalRecords={10}
        isNavigating={false}
      />
    );

    const nextButton = screen.getByTestId("next-record-button");
    await user.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it("should call onPrevious when previous button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={true}
        canNavigatePrevious={true}
        currentIndex={1}
        totalRecords={10}
        isNavigating={false}
      />
    );

    const previousButton = screen.getByTestId("previous-record-button");
    await user.click(previousButton);

    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it("should disable buttons when isNavigating is true", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={true}
        canNavigatePrevious={true}
        currentIndex={1}
        totalRecords={10}
        isNavigating={true}
      />
    );

    const previousButton = screen.getByTestId("previous-record-button");
    const nextButton = screen.getByTestId("next-record-button");

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("should have select-none class on position indicator", () => {
    render(
      <RecordNavigationControls
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        canNavigateNext={true}
        canNavigatePrevious={true}
        currentIndex={1}
        totalRecords={10}
        isNavigating={false}
      />
    );

    const indicator = screen.getByTestId("record-position-indicator");
    expect(indicator).toHaveClass("select-none");
  });
});
