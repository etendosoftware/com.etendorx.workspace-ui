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

import { render, act, waitFor } from "@testing-library/react";
import { PreferencesProvider, usePreferences } from "@/contexts/preferences";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock Image
class MockImage {
  onload: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  src = "";

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

(global as unknown as { Image: typeof MockImage }).Image = MockImage;

// Mock canvas
interface MockCanvasContext {
  drawImage: jest.Mock;
  beginPath: jest.Mock;
  arc: jest.Mock;
  fill: jest.Mock;
  stroke: jest.Mock;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
}

const mockContext: MockCanvasContext = {
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
};

HTMLCanvasElement.prototype.getContext = jest.fn(
  () => mockContext
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/png;base64,mock");

// Mock document.querySelector and createElement for favicon link
interface MockLinkElement {
  rel: string;
  href: string;
}

const mockLink: MockLinkElement = { rel: "icon", href: "" };
document.querySelector = jest.fn(() => mockLink) as unknown as typeof document.querySelector;

describe("PreferencesContext", () => {
  let contextValue: ReturnType<typeof usePreferences>;

  const TestComponent = () => {
    contextValue = usePreferences();
    return null;
  };

  const renderWithProvider = () => {
    return render(
      <PreferencesProvider>
        <TestComponent />
      </PreferencesProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockLink.href = "";
  });

  describe("usePreferences hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("usePreferences must be used within a PreferencesProvider");

      consoleError.mockRestore();
    });

    it("should provide context values", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.customFaviconColor).toBeNull();
        expect(typeof contextValue.setCustomFaviconColor).toBe("function");
      });
    });
  });

  describe("localStorage initialization", () => {
    it("should load saved color from localStorage on mount", async () => {
      localStorageMock.getItem.mockReturnValueOnce("#E53935");

      renderWithProvider();

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith("settings.favicon_badge");
        expect(contextValue.customFaviconColor).toBe("#E53935");
      });
    });

    it("should have null color when localStorage is empty", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(contextValue.customFaviconColor).toBeNull();
      });
    });
  });

  describe("setCustomFaviconColor", () => {
    it("should save color to localStorage when set", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      act(() => {
        contextValue.setCustomFaviconColor("#1E88E5");
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith("settings.favicon_badge", "#1E88E5");
    });

    it("should remove from localStorage when color is null", async () => {
      localStorageMock.getItem.mockReturnValueOnce("#E53935");
      renderWithProvider();

      await waitFor(() => {
        expect(contextValue.customFaviconColor).toBe("#E53935");
      });

      act(() => {
        contextValue.setCustomFaviconColor(null);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("settings.favicon_badge");
    });
  });

  describe("favicon update", () => {
    it("should restore original favicon when color is null", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(mockLink.href).toBe("/favicon.ico");
      });
    });

    it("should update favicon with badge when color is set", async () => {
      localStorageMock.getItem.mockReturnValueOnce("#E53935");
      renderWithProvider();

      await waitFor(() => {
        expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalled();
      });
    });
  });
});
