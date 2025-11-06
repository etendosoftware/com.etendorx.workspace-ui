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
import SelectionCounter from "../../../../src/components/Table/RecordCounters/SelectionCounter";

describe("SelectionCounter Component", () => {
  it("should not render when selectedCount is 0", () => {
    const { container } = render(<SelectionCounter selectedCount={0} />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when selectedCount is negative", () => {
    const { container } = render(<SelectionCounter selectedCount={-1} />);

    expect(container.firstChild).toBeNull();
  });

  it("should display selection count when selectedCount is 1", () => {
    render(<SelectionCounter selectedCount={1} />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("should display selection count when selectedCount is greater than 1", () => {
    render(<SelectionCounter selectedCount={5} />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("5 selected")).toBeInTheDocument();
  });

  it("should handle large selection counts", () => {
    render(<SelectionCounter selectedCount={1000} />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("1000 selected")).toBeInTheDocument();
  });

  it("should have correct Tailwind classes", () => {
    render(<SelectionCounter selectedCount={3} />);

    const element = screen.getByTestId("SelectionCounter");
    expect(element).toBeInTheDocument();

    // Check that the element has the correct Tailwind classes
    expect(element).toHaveClass("text-sm", "font-semibold");
  });

  it("should use custom label when provided", () => {
    render(<SelectionCounter selectedCount={3} selectedLabel="{count} elementos seleccionados" />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("3 elementos seleccionados")).toBeInTheDocument();
  });
});
