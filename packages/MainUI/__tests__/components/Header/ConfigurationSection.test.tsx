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

import { render, screen, fireEvent, act } from "@testing-library/react";
import ConfigurationSection from "@/components/Header/ConfigurationSection";

// Mock useTranslation - return stable reference
const mockT = jest.fn((key: string) => key);
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock usePreferences
const mockSetCustomFaviconColor = jest.fn();
jest.mock("@/contexts/preferences", () => ({
  usePreferences: () => ({
    customFaviconColor: null,
    setCustomFaviconColor: mockSetCustomFaviconColor,
  }),
}));

// Mock useLocalStorage with stable reference
const mockSetDensity = jest.fn();
jest.mock("@workspaceui/componentlibrary/src/hooks/useLocalStorage", () => ({
  useLocalStorage: () => ["default-scale", mockSetDensity],
}));

// Mock modalConfig
jest.mock("@/mocks", () => ({
  modalConfig: {
    icon: null,
    title: { icon: null, label: "Quick Setup" },
    linkTitle: { label: "View all settings", url: "/settings" },
    sections: [
      {
        id: "density",
        name: "Interface scale",
        items: [
          { id: "small-scale", img: "small.svg", label: "Small" },
          { id: "default-scale", img: "default.svg", label: "Default" },
          { id: "large-scale", img: "large.svg", label: "Large" },
        ],
        selectedItem: 1,
        isDisabled: false,
        itemsPerRow: 3,
      },
      {
        id: "faviconBadge",
        name: "Favicon Badge",
        items: [
          { id: "favicon-badge-none", img: null, color: null, label: "None" },
          { id: "favicon-badge-red", img: null, color: "#E53935", label: "Red" },
        ],
        selectedItem: 0,
        isDisabled: false,
        itemsPerRow: 4,
      },
    ],
    onChangeSelect: jest.fn(),
  },
}));

// Mock ConfigurationModal - capture props for testing
interface MockSection {
  id: string;
  name: string;
  items: Array<{ id: string; label: string }>;
}

interface MockOnChangeSelectPayload {
  id: string;
  sectionId: string;
  sectionIndex: number;
  imageIndex: number;
}

jest.mock("@workspaceui/componentlibrary/src/components", () => ({
  ConfigurationModal: ({
    sections,
    onChangeSelect,
  }: {
    sections: MockSection[];
    onChangeSelect: (payload: MockOnChangeSelectPayload) => void;
  }) => {
    return (
      <div data-testid="configuration-modal">
        {sections?.map((section: MockSection, sectionIdx: number) => (
          <div key={section.id} data-testid={`section-${section.id}`}>
            <span>{section.name}</span>
            {section.items?.map((item: { id: string; label: string }, itemIdx: number) => (
              <button
                type="button"
                key={item.id}
                data-testid={`item-${item.id}`}
                onClick={() =>
                  onChangeSelect({
                    id: item.id,
                    sectionId: section.id,
                    sectionIndex: sectionIdx,
                    imageIndex: itemIdx,
                  })
                }>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

describe("ConfigurationSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render ConfigurationModal", async () => {
    await act(async () => {
      render(<ConfigurationSection />);
    });
    expect(screen.getByTestId("configuration-modal")).toBeInTheDocument();
  });

  it("should render favicon badge section", async () => {
    await act(async () => {
      render(<ConfigurationSection />);
    });
    expect(screen.getByTestId("section-faviconBadge")).toBeInTheDocument();
  });

  it("should call setCustomFaviconColor when favicon badge color is selected", async () => {
    await act(async () => {
      render(<ConfigurationSection />);
    });

    await act(async () => {
      const redButton = screen.getByTestId("item-favicon-badge-red");
      fireEvent.click(redButton);
    });

    expect(mockSetCustomFaviconColor).toHaveBeenCalledWith("#E53935");
  });

  it("should call setCustomFaviconColor with null when None is selected", async () => {
    await act(async () => {
      render(<ConfigurationSection />);
    });

    await act(async () => {
      const noneButton = screen.getByTestId("item-favicon-badge-none");
      fireEvent.click(noneButton);
    });

    expect(mockSetCustomFaviconColor).toHaveBeenCalledWith(null);
  });
});
