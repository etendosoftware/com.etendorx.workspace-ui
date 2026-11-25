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

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  CHARACTERISTICS_TREE_DATASOURCE_ID,
  type CharacteristicsFilterContext,
} from "@/utils/table/characteristicsFilter";
import { VALUE_IDS, buildCharacteristicsTreeOptions, pickOptions } from "@/utils/table/test-utils/characteristicsTree";
import { TreeColumnFilter } from "../TreeColumnFilter";

const mockFetchFilterOptions = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@workspaceui/api-client/src/hooks/useColumnFilterData", () => ({
  useColumnFilterData: () => ({ fetchFilterOptions: mockFetchFilterOptions }),
}));

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

const PLACEHOLDER = "Filter Characteristic Description...";
const LINE_FIELD = "product$characteristicDescription";
const NAME_CRITERIA = { fieldName: "name", operator: "iContains", value: "Cola" };
const BOTTLE_LEAVES = [VALUE_IDS.VIDRIO, VALUE_IDS.PET, VALUE_IDS.VIDRIO_RETORNABLE];

const buildColumn = (reference: string = FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id): Column =>
  ({
    id: "characteristicDescription",
    columnName: LINE_FIELD,
    name: "Characteristic Description",
    column: { reference },
  }) as unknown as Column;

const gridContext: CharacteristicsFilterContext = {
  entityName: "OrderLine",
  parentDatasourceId: "OrderLine",
  getCriteria: () => [NAME_CRITERIA, { isProductCharacteristicsCriteria: true }],
};

interface RenderOptions {
  appliedOptions?: FilterOption[];
  context?: CharacteristicsFilterContext;
}

const renderCharacteristicsFilter = ({ appliedOptions = [], context = gridContext }: RenderOptions = {}) => {
  const onSelectionChange = jest.fn();
  render(
    <TreeColumnFilter
      column={buildColumn()}
      entityName="OrderLine"
      characteristicsContext={context}
      appliedOptions={appliedOptions}
      onSelectionChange={onSelectionChange}
      placeholder={PLACEHOLDER}
    />
  );
  return { onSelectionChange };
};

const openFilter = async (trigger: string = PLACEHOLDER) => {
  fireEvent.click(screen.getByText(trigger));
  await screen.findByText("Envase");
};

const getRow = (label: string) => screen.getByText(label).closest("li") as HTMLElement;
const getCheckbox = (label: string) => getRow(label).querySelector("input[type='checkbox']") as HTMLInputElement;
const getRowLabels = () => Array.from(document.querySelectorAll("ul li")).map((row) => row.textContent?.trim());
const getSearchInput = () => document.querySelector("input:not([type='checkbox'])") as HTMLInputElement;

describe("TreeColumnFilter - Product Characteristics", () => {
  beforeEach(() => {
    mockFetchFilterOptions.mockReset();
    mockFetchFilterOptions.mockResolvedValue(buildCharacteristicsTreeOptions());
  });

  it("loads the tree of the grid with its criteria and the product path of the column", async () => {
    renderCharacteristicsFilter();

    await openFilter();

    expect(mockFetchFilterOptions).toHaveBeenCalledWith({
      datasourceId: CHARACTERISTICS_TREE_DATASOURCE_ID,
      treeParams: {
        _parentDSIdentifier: "OrderLine",
        _propertyPath: "e.product",
        _processId: undefined,
        _buttonOwnerContextInfo: undefined,
        criteria: [NAME_CRITERIA],
      },
    });
  });

  it("sorts characteristics, groups and values alphabetically on each level", async () => {
    renderCharacteristicsFilter();

    await openFilter();

    expect(getRowLabels()).toEqual([
      "Certificación",
      "Bio",
      "Sin azúcar",
      "Vegano",
      "Envase",
      "Botella",
      "PET",
      "Retornable",
      "Vidrio retornable",
      "Vidrio",
      "Lata",
      "Formato",
      "1 L",
      "330 ml",
      "500 ml",
    ]);
  });

  it("selects every value of a group, with the exists query of the column", async () => {
    const { onSelectionChange } = renderCharacteristicsFilter();
    await openFilter();

    fireEvent.click(getRow("Botella"));

    const [ids, options] = onSelectionChange.mock.calls[0];
    expect(ids).toEqual(BOTTLE_LEAVES);
    expect(options.map((option: FilterOption) => option.id)).toEqual(BOTTLE_LEAVES);
    expect(options[0].existsQuery).toContain("where e.product = v.product");
  });

  it("unselects a fully selected group with its checkbox", async () => {
    const { onSelectionChange } = renderCharacteristicsFilter({ appliedOptions: pickOptions(BOTTLE_LEAVES) });
    await openFilter("Envase:[Vidrio - PET - Vidrio retornable]");

    // Once loaded, the text follows the sorted tree, as Classic lists the selection
    expect(screen.getByText("Envase:[PET - Retornable - Vidrio]")).toBeInTheDocument();
    expect(getCheckbox("Botella").checked).toBe(true);
    fireEvent.click(getCheckbox("Botella"));

    expect(onSelectionChange).toHaveBeenCalledWith([], []);
  });

  it("shows partially selected groups and the Classic text of the applied values", async () => {
    renderCharacteristicsFilter({ appliedOptions: pickOptions([VALUE_IDS.VIDRIO, VALUE_IDS.BIO]) });

    expect(screen.getByText("Envase:[Vidrio], Certificación:[Bio]")).toBeInTheDocument();
    await openFilter("Envase:[Vidrio], Certificación:[Bio]");

    expect(getCheckbox("Botella").getAttribute("data-indeterminate")).toBe("true");
    expect(getCheckbox("Envase").getAttribute("data-indeterminate")).toBe("true");
    expect(getCheckbox("Vidrio").checked).toBe(true);
  });

  it("clears the filter", () => {
    const { onSelectionChange } = renderCharacteristicsFilter({ appliedOptions: pickOptions([VALUE_IDS.LATA]) });

    fireEvent.click(screen.getByText("Envase:[Lata]").parentElement?.querySelector("button") as HTMLElement);

    expect(onSelectionChange).toHaveBeenCalledWith([], []);
  });

  it("reloads the tree on every opening and searches it locally", async () => {
    jest.useFakeTimers();
    try {
      renderCharacteristicsFilter();
      await act(async () => {
        fireEvent.click(screen.getByText(PLACEHOLDER));
      });
      fireEvent.change(getSearchInput(), {
        target: { value: "vid" },
      });
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      expect(getRowLabels()).toEqual(["Envase", "Botella", "Retornable", "Vidrio retornable", "Vidrio"]);
      expect(mockFetchFilterOptions).toHaveBeenCalledTimes(1);

      await act(async () => {
        fireEvent.click(screen.getByText(PLACEHOLDER));
      });
      await act(async () => {
        fireEvent.click(screen.getByText(PLACEHOLDER));
      });
      expect(mockFetchFilterOptions).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("toggles a row with Enter or Space on it", async () => {
    const { onSelectionChange } = renderCharacteristicsFilter();
    await openFilter();

    fireEvent.keyDown(getRow("Lata"), { key: " " });

    expect(onSelectionChange).toHaveBeenCalledWith(
      [VALUE_IDS.LATA],
      [expect.objectContaining({ id: VALUE_IDS.LATA, characteristic: "C_ENV" })]
    );
  });

  it("toggles the highlighted node with Enter", async () => {
    const { onSelectionChange } = renderCharacteristicsFilter();
    await openFilter();
    const searchInput = getSearchInput();

    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    // The first row (Certificación) is highlighted on opening, so Down moves to Bio
    const [ids] = onSelectionChange.mock.calls[0];
    expect(ids).toEqual([VALUE_IDS.BIO]);
  });
});

describe("TreeColumnFilter - other tree references", () => {
  const renderExternalTree = () => {
    const onSelectionChange = jest.fn();
    render(
      <TreeColumnFilter
        options={buildCharacteristicsTreeOptions()}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        placeholder={PLACEHOLDER}
      />
    );
    fireEvent.click(screen.getByText(PLACEHOLDER));
    return { onSelectionChange };
  };

  it("collapses a characteristic when its row is clicked", () => {
    renderExternalTree();

    fireEvent.click(getRow("Formato"));

    expect(screen.queryByText("330 ml")).toBeNull();
  });

  it("adds one value with its checkbox and keeps the dropdown open", () => {
    const { onSelectionChange } = renderExternalTree();

    fireEvent.click(getCheckbox("Lata"));

    expect(onSelectionChange).toHaveBeenCalledWith([VALUE_IDS.LATA], pickOptions([VALUE_IDS.LATA]));
    expect(getRow("Vidrio")).toBeInTheDocument();
  });

  it("keeps selecting a single value and the characteristic nodes not selectable", () => {
    const onSelectionChange = jest.fn();
    render(
      <TreeColumnFilter
        options={buildCharacteristicsTreeOptions()}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        placeholder={PLACEHOLDER}
      />
    );
    fireEvent.click(screen.getByText(PLACEHOLDER));

    expect(getRow("Envase").querySelector("input[type='checkbox']")).toBeNull();
    fireEvent.click(getRow("Lata"));

    expect(onSelectionChange).toHaveBeenCalledWith([VALUE_IDS.LATA], pickOptions([VALUE_IDS.LATA]));
  });

  it("does not sort a tree reference without characteristics context", async () => {
    mockFetchFilterOptions.mockResolvedValue(buildCharacteristicsTreeOptions());
    render(
      <TreeColumnFilter
        column={buildColumn(FIELD_REFERENCE_CODES.TREE_REFERENCE.id)}
        entityName="OrderLine"
        onSelectionChange={jest.fn()}
        placeholder={PLACEHOLDER}
      />
    );

    fireEvent.click(screen.getByText(PLACEHOLDER));

    await waitFor(() => expect(getRowLabels()[0]).toBe("Envase"));
    expect(mockFetchFilterOptions).toHaveBeenCalledWith(expect.not.objectContaining({ treeParams: expect.anything() }));
  });
});
