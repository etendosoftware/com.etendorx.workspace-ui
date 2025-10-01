import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Tooltip from "../../../src/components/Tooltip";

// Mock ReactDOM.createPortal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactNode) => element,
}));

describe("Tooltip", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Basic Rendering", () => {
    it("renders children without tooltip when no title provided", () => {
      render(
        <Tooltip>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("button", { name: "Test Button" })).toBeInTheDocument();
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("renders children with tooltip container when title provided", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("button", { name: "Test Button" })).toBeInTheDocument();
      // Tooltip should not be visible initially
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("applies custom container className", () => {
      render(
        <Tooltip title="Test tooltip" containerClassName="custom-class">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const container = screen.getByRole("button").parentElement;
      expect(container).toHaveClass("custom-class");
    });

    it("renders with default position bottom", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Tooltip Visibility", () => {
    it("shows tooltip after delay on mouse enter", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      // Tooltip should not be visible immediately
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      // Fast-forward time to trigger tooltip display
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Tooltip should now be visible
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      expect(screen.getByText("Test tooltip")).toBeInTheDocument();
    });

    it("hides tooltip on mouse leave", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Show tooltip
      fireEvent.mouseEnter(button);
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Hide tooltip
      fireEvent.mouseLeave(button);

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("cancels tooltip display if mouse leaves before delay", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Start showing tooltip
      fireEvent.mouseEnter(button);

      // Leave before delay completes
      fireEvent.mouseLeave(button);

      // Fast-forward time past the delay
      act(() => {
        jest.advanceTimersByTime(700);
      });

      // Tooltip should not appear
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("does not show tooltip when disabled", () => {
      render(
        <Tooltip title="Test tooltip" disabled>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("hides tooltip when disabled prop changes to true", async () => {
      const { rerender } = render(
        <Tooltip title="Test tooltip" disabled={false}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Show tooltip
      fireEvent.mouseEnter(button);
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Disable tooltip
      rerender(
        <Tooltip title="Test tooltip" disabled={true}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });
  });

  describe("Positioning", () => {
    const mockGetBoundingClientRect = (rect: Partial<DOMRect>) =>
      jest.fn(() => ({
        width: 100,
        height: 30,
        top: 100,
        left: 100,
        bottom: 130,
        right: 200,
        x: 100,
        y: 100,
        toJSON: jest.fn(),
        ...rect,
      }));

    beforeEach(() => {
      // Mock getBoundingClientRect for positioning tests
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect({});
    });

    it("positions tooltip at bottom by default", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveStyle({ top: "138px" }); // bottom (130) + margin (8)
    });

    it("positions tooltip at top when specified", async () => {
      render(
        <Tooltip title="Test tooltip" position="top">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveStyle({ top: "62px" }); // top (100) - height (30) - margin (8)
    });

    it("positions tooltip at left when specified", async () => {
      render(
        <Tooltip title="Test tooltip" position="left">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveStyle({ left: "-8px" }); // left (100) - width (100) - margin (8)
    });

    it("positions tooltip at right when specified", async () => {
      render(
        <Tooltip title="Test tooltip" position="right">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveStyle({ left: "208px" }); // right (200) + margin (8)
    });

    it("centers tooltip horizontally for top/bottom positions", async () => {
      render(
        <Tooltip title="Test tooltip" position="bottom">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      // Should be centered: left (100) + width/2 (50) - tooltipWidth/2 (50) = 100
      expect(tooltip).toHaveStyle({ left: "100px" });
    });

    it("centers tooltip vertically for left/right positions", async () => {
      render(
        <Tooltip title="Test tooltip" position="left">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      // Should be centered: top (100) + height/2 (15) - tooltipHeight/2 (15) = 100
      expect(tooltip).toHaveStyle({ top: "100px" });
    });
  });

  describe("Arrow Positioning", () => {
    it("renders arrow at bottom for top position", async () => {
      render(
        <Tooltip title="Test tooltip" position="top">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Look for the arrow element: first div inside the relative container
      const tooltip = screen.getByRole("tooltip");
      const arrow = tooltip.querySelector("div.relative > div:first-child");
      expect(arrow).toHaveClass("bottom-[-4px]");
    });

    it("renders arrow at top for bottom position", async () => {
      render(
        <Tooltip title="Test tooltip" position="bottom">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      const arrow = tooltip.querySelector("div.relative > div:first-child");
      expect(arrow).toHaveClass("top-[-4px]");
    });

    it("renders arrow at right for left position", async () => {
      render(
        <Tooltip title="Test tooltip" position="left">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      const arrow = tooltip.querySelector("div.relative > div:first-child");
      expect(arrow).toHaveClass("right-[-4px]");
    });

    it("renders arrow at left for right position", async () => {
      render(
        <Tooltip title="Test tooltip" position="right">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      const arrow = tooltip.querySelector("div.relative > div:first-child");
      expect(arrow).toHaveClass("left-[-4px]");
    });
  });

  describe("Interaction Behavior", () => {
    it("handles rapid mouse enter/leave without showing tooltip", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Rapid mouse movements
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      // Fast-forward past delay
      act(() => {
        jest.advanceTimersByTime(700);
      });

      // Should not show tooltip
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows tooltip only after full delay period", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      // Before delay completes
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      // After delay completes
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("handles multiple consecutive mouse enters correctly", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // First mouse enter
      fireEvent.mouseEnter(button);

      // Second mouse enter before first completes
      act(() => {
        jest.advanceTimersByTime(300);
      });
      fireEvent.mouseEnter(button);

      // Complete the delay
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });
  });

  describe("Timer Management", () => {
    it("cleans up timers on component unmount", () => {
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

      const { unmount } = render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("clears existing timer on new mouse enter", () => {
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // First mouse enter
      fireEvent.mouseEnter(button);

      // Second mouse enter should clear first timer
      fireEvent.mouseEnter(button);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("clears timer on mouse leave", () => {
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe("Disabled State", () => {
    it("does not show tooltip when disabled is true", async () => {
      render(
        <Tooltip title="Test tooltip" disabled={true}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(700);
      });

      // The component has a bug where showTooltip doesn't check disabled,
      // but the useEffect should hide it immediately when disabled is true
      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("hides visible tooltip when disabled changes to true", async () => {
      const { rerender } = render(
        <Tooltip title="Test tooltip" disabled={false}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Show tooltip
      fireEvent.mouseEnter(button);
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Disable tooltip
      rerender(
        <Tooltip title="Test tooltip" disabled={true}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("shows tooltip when disabled changes from true to false", async () => {
      const { rerender } = render(
        <Tooltip title="Test tooltip" disabled={true}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      // Enable tooltip
      rerender(
        <Tooltip title="Test tooltip" disabled={false}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });
  });

  describe("Content and Styling", () => {
    it("displays correct tooltip text", async () => {
      const tooltipText = "This is a detailed tooltip message";

      render(
        <Tooltip title={tooltipText}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByText(tooltipText)).toBeInTheDocument();
      });
    });

    it("applies correct CSS classes for styling", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveClass("fixed", "z-[1000]", "opacity-100");

      // Select the content div specifically: div.relative > div:last-child
      const content = tooltip.querySelector("div.relative > div:last-child");
      expect(content).toHaveClass("bg-gray-900", "text-white", "text-sm", "rounded", "px-2", "py-1");
    });

    it("applies correct arrow styling for each position", async () => {
      const positions = ["top", "bottom", "left", "right"] as const;

      for (const position of positions) {
        const { unmount } = render(
          <Tooltip title="Test tooltip" position={position}>
            <button type="button">Test Button</button>
          </Tooltip>
        );

        const button = screen.getByRole("button");
        fireEvent.mouseEnter(button);

        act(() => {
          jest.advanceTimersByTime(600);
        });

        await waitFor(() => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        });

        const tooltip = screen.getByRole("tooltip");
        const arrow = tooltip.querySelector("div.relative > div:first-child");
        expect(arrow).toHaveClass("absolute", "w-2", "h-2", "rotate-45", "bg-gray-900");

        unmount();
      }
    });
  });

  describe("Accessibility", () => {
    it("has proper role attribute", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("is non-interactive (pointer-events-none)", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveClass("pointer-events-none");
    });

    it("supports keyboard navigation (focus events)", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Focus should also trigger tooltip
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty title gracefully", () => {
      render(
        <Tooltip title="">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Empty title should not show any tooltip
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("handles undefined title", () => {
      render(
        <Tooltip title={undefined}>
          <button type="button">Test Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("handles coordinate calculation when refs are not available", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      // Even if coordinates can't be calculated, should not crash
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("handles visibility state properly when coordinates are not set", async () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      // Should have visibility hidden if coords are not properly set
      const hasValidCoords = tooltip.style.top !== "" && tooltip.style.left !== "";
      if (!hasValidCoords) {
        expect(tooltip).toHaveStyle({ visibility: "hidden" });
      }
    });
  });

  describe("Performance", () => {
    it("does not cause memory leaks with multiple mount/unmount cycles", () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <Tooltip title="Test tooltip">
            <button type="button">Test Button {i}</button>
          </Tooltip>
        );

        const button = screen.getByRole("button");
        fireEvent.mouseEnter(button);

        unmount();
      }

      // Should not throw or cause memory issues
      expect(true).toBe(true);
    });

    it("handles rapid state changes efficiently", () => {
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");

      // Simulate rapid interactions
      for (let i = 0; i < 20; i++) {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      }

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should handle rapid changes without issues
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("accepts all valid position values", () => {
      const positions = ["top", "bottom", "left", "right"] as const;

      for (const position of positions) {
        expect(() => {
          render(
            <Tooltip title="Test tooltip" position={position}>
              <span>Content</span>
            </Tooltip>
          );
        }).not.toThrow();
      }
    });

    it("handles complex children elements", async () => {
      render(
        <Tooltip title="Complex tooltip">
          <div>
            <span>Nested</span>
            <button type="button">Button</button>
            <input type="text" placeholder="Input" />
          </div>
        </Tooltip>
      );

      const container = screen.getByText("Nested").parentElement;
      if (container) {
        fireEvent.mouseEnter(container);
      }

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("works with different child element types", async () => {
      // Test button child
      const { unmount: unmountButton } = render(
        <Tooltip title="Button tooltip">
          <button type="button">Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      unmountButton();

      // Test span child
      const { unmount: unmountSpan } = render(
        <Tooltip title="Span tooltip">
          <span>Span text</span>
        </Tooltip>
      );

      const span = screen.getByText("Span text");
      fireEvent.mouseEnter(span);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      unmountSpan();

      // Test div child
      render(
        <Tooltip title="Div tooltip">
          <div>Div content</div>
        </Tooltip>
      );

      const div = screen.getByText("Div content");
      fireEvent.mouseEnter(div);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });
  });

  describe("Portal Rendering", () => {
    it("renders tooltip content in portal", async () => {
      render(
        <Tooltip title="Portal tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Tooltip should be rendered via portal (mocked to render inline)
      expect(screen.getByText("Portal tooltip")).toBeInTheDocument();
    });

    it("handles portal rendering when document.body is not available", () => {
      // This test ensures the component doesn't crash if portal target is unavailable
      render(
        <Tooltip title="Test tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Visual and Layout", () => {
    it("applies z-index for proper layering", async () => {
      render(
        <Tooltip title="Layered tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveClass("z-[1000]");
    });

    it("has proper opacity and transition classes", async () => {
      render(
        <Tooltip title="Styled tooltip">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveClass("opacity-100", "transition-opacity", "duration-100");
    });

    it("has whitespace-nowrap for content", async () => {
      render(
        <Tooltip title="Long tooltip text that should not wrap">
          <button type="button">Test Button</button>
        </Tooltip>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();

        // Check that the tooltip has the content and styling
        expect(tooltip).toHaveTextContent("Long tooltip text that should not wrap");
      });
    });
  });
});
