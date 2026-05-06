import React from "react";

export const UseSelectedMock = {
  useSelected: () => ({ graph: { getChildren: () => [] } }),
};

export const WindowContextMock = {
  useWindowContext: () => ({
    activeWindow: { navigation: { activeLevels: [], activeTabsByLevel: new Map() } },
    getTabFormState: jest.fn(),
    clearChildrenSelections: jest.fn(),
  }),
};

export const IconButtonMock = {
  __esModule: true,
  default: ({ children, onClick, disabled, "data-testid": testId }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid={testId}>
      {children}
    </button>
  ),
};

export const IconButtonWithTextMock = {
  __esModule: true,
  default: ({ text, onClick, disabled, "data-testid": testId }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid={testId}>
      {text}
    </button>
  ),
};
