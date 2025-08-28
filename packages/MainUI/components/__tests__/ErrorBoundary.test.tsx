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

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Component that throws an error when errorFlag is true
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

// Wrapper component to test the error boundary
const TestWrapper: React.FC<{ shouldThrow: boolean; fallback?: React.ReactNode }> = ({
  shouldThrow,
  fallback,
}) => {
  const theme = createTheme();
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for expected error tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render children when there is no error", () => {
    render(<TestWrapper shouldThrow={false} />);
    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should render error UI when there is an error", () => {
    render(<TestWrapper shouldThrow={true} />);
    expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    const customFallback = <div>Custom error message</div>;
    render(<TestWrapper shouldThrow={true} fallback={customFallback} />);
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("should reset error state when retry button is clicked", () => {
    let shouldThrow = true;
    
    const DynamicThrowError: React.FC = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>No error</div>;
    };

    const theme = createTheme();
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <DynamicThrowError />
        </ErrorBoundary>
      </ThemeProvider>
    );
    
    // Error boundary should be showing
    expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    
    // Change the flag to not throw error anymore
    shouldThrow = false;
    
    // Click retry button
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    
    // Re-render the component
    rerender(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <DynamicThrowError />
        </ErrorBoundary>
      </ThemeProvider>
    );
    
    // Should show the normal content now
    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should not show error boundary UI for authentication errors", () => {
    // Test that getDerivedStateFromError properly handles auth errors
    const authError = new Error("Session expired. Please login again.");
    const state = ErrorBoundary.getDerivedStateFromError(authError);
    
    expect(state.hasError).toBe(false);
    expect(state.error).toBeNull();
    
    // Test with regular error
    const regularError = new Error("Regular error");
    const regularState = ErrorBoundary.getDerivedStateFromError(regularError);
    
    expect(regularState.hasError).toBe(true);
    expect(regularState.error).toBe(regularError);
  });
});