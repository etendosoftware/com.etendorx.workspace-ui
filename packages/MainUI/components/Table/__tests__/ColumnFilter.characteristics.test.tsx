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

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import type { CharacteristicsFilterContext } from "@/utils/table/characteristicsFilter";
import { ColumnFilter } from "../ColumnFilter";

interface TreeColumnFilterMockProps {
  column?: Column;
  entityName?: string;
  characteristicsContext?: CharacteristicsFilterContext;
  appliedOptions?: FilterOption[];
  onSelectionChange: (ids: string[], options?: FilterOption[]) => void;
}

const mockTreeProps = jest.fn();

jest.mock("../TreeColumnFilter", () => ({
  TreeColumnFilter: (props: TreeColumnFilterMockProps) => {
    mockTreeProps(props);
    return (
      <button type="button" data-testid="tree-filter" onClick={() => props.onSelectionChange(["V1"], undefined)}>
        tree
      </button>
    );
  },
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const characteristicsColumn = {
  id: "characteristicDescription",
  columnName: "characteristicDescription",
  name: "Characteristic Description",
  column: { reference: FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id },
} as unknown as Column;

const context: CharacteristicsFilterContext = { entityName: "ManageVariants", alias: "e", processId: "P1" };
const appliedOption: FilterOption = { id: "V1", label: "Bio", value: "Bio", characteristic: "C1" };

describe("ColumnFilter - Product Characteristics in process grids", () => {
  beforeEach(() => mockTreeProps.mockClear());

  it("uses the characteristics tree of the process with the applied options", () => {
    const onFilterChange = jest.fn();
    render(
      <ColumnFilter
        column={characteristicsColumn}
        filterState={{
          id: "c",
          selectedOptions: [appliedOption],
          availableOptions: [],
          isMultiSelect: true,
          loading: false,
        }}
        onFilterChange={onFilterChange}
        characteristicsContext={context}
      />
    );

    expect(mockTreeProps).toHaveBeenCalledWith(
      expect.objectContaining({
        column: characteristicsColumn,
        entityName: "ManageVariants",
        characteristicsContext: context,
        appliedOptions: [appliedOption],
      })
    );
    fireEvent.click(screen.getByTestId("tree-filter"));
    expect(onFilterChange).toHaveBeenCalledWith([]);
  });

  it("keeps the generic tree filter without characteristics context", () => {
    render(<ColumnFilter column={characteristicsColumn} onFilterChange={jest.fn()} />);

    expect(mockTreeProps).toHaveBeenCalledWith(
      expect.not.objectContaining({ characteristicsContext: expect.anything() })
    );
  });
});
