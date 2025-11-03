import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomModal from "../../../src/components/Modal/CustomModal";

describe("CustomModal", () => {
  const defaultProps = {
    isOpen: true,
    title: "Test Modal",
    iframeLoading: false,
    url: "https://example.com",
    handleClose: jest.fn(),
    texts: {
      loading: "Loading...",
      iframeTitle: "Modal Content",
      noData: "No data available",
      closeButton: "Close",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<CustomModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true", () => {
      render(<CustomModal {...defaultProps} />);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
      expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("should render modal title correctly", () => {
      render(<CustomModal {...defaultProps} title="Custom Title" />);

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("should apply custom content class", () => {
      const { container } = render(<CustomModal {...defaultProps} customContentClass="custom-class" />);

      const modalContent = container.querySelector(".custom-class");
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when iframeLoading is true", () => {
      render(<CustomModal {...defaultProps} iframeLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should hide loading spinner when iframeLoading is false", () => {
      render(<CustomModal {...defaultProps} iframeLoading={false} />);

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("should render loading spinner with correct styling", () => {
      render(<CustomModal {...defaultProps} iframeLoading={true} />);

      const loadingText = screen.getByText("Loading...");
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveClass("mt-2", "font-medium");
    });
  });

  describe("No Data State", () => {
    it("should show no data message when url is empty and not loading", () => {
      render(<CustomModal {...defaultProps} url="" iframeLoading={false} />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should not show no data message when url is provided", () => {
      render(<CustomModal {...defaultProps} url="https://example.com" />);

      expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    });

    it("should not show no data message when loading", () => {
      render(<CustomModal {...defaultProps} url="" iframeLoading={true} />);

      expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    });
  });

  describe("Iframe Rendering", () => {
    it("should render iframe with correct URL", () => {
      render(<CustomModal {...defaultProps} url="https://test.com" />);

      const iframe = screen.getByTitle("Modal Content");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("src", "https://test.com");
    });

    it("should render iframe with correct title", () => {
      const customTexts = { ...defaultProps.texts, iframeTitle: "Custom Iframe Title" };
      render(<CustomModal {...defaultProps} texts={customTexts} />);

      const iframe = screen.getByTitle("Custom Iframe Title");
      expect(iframe).toBeInTheDocument();
    });

    it("should call handleIframeLoad when iframe loads", () => {
      const handleIframeLoad = jest.fn();
      render(<CustomModal {...defaultProps} handleIframeLoad={handleIframeLoad} />);

      const iframe = screen.getByTitle("Modal Content");
      fireEvent.load(iframe);

      expect(handleIframeLoad).toHaveBeenCalledTimes(1);
    });

    it("should not crash when handleIframeLoad is not provided", () => {
      expect(() => {
        render(<CustomModal {...defaultProps} handleIframeLoad={undefined} />);
        const iframe = screen.getByTitle("Modal Content");
        fireEvent.load(iframe);
      }).not.toThrow();
    });
  });

  describe("Custom Content", () => {
    it("should render custom content when provided", () => {
      const customContent = <div data-testid="custom-content">Custom Content</div>;
      render(<CustomModal {...defaultProps} customContent={customContent} />);

      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
      expect(screen.getByText("Custom Content")).toBeInTheDocument();
    });

    it("should render both custom content and iframe", () => {
      const customContent = <div data-testid="custom-content">Custom Content</div>;
      render(<CustomModal {...defaultProps} customContent={customContent} />);

      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
      expect(screen.getByTitle("Modal Content")).toBeInTheDocument();
    });

    it("should not crash when custom content is undefined", () => {
      expect(() => {
        render(<CustomModal {...defaultProps} customContent={undefined} />);
      }).not.toThrow();
    });
  });

  describe("Close Button", () => {
    it("should render close button with correct text", () => {
      render(<CustomModal {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent("Close");
    });

    it("should call handleClose when close button is clicked", () => {
      const handleClose = jest.fn();
      render(<CustomModal {...defaultProps} handleClose={handleClose} />);

      const closeButton = screen.getByTestId("close-button");
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should render close button with custom text", () => {
      const customTexts = { ...defaultProps.texts, closeButton: "Cerrar" };
      render(<CustomModal {...defaultProps} texts={customTexts} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveTextContent("Cerrar");
    });

    it("should have correct styling on close button", () => {
      render(<CustomModal {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveClass(
        "mx-auto",
        "rounded",
        "bg-[var(--color-etendo-main)]",
        "px-4",
        "py-2",
        "font-medium",
        "text-white"
      );
    });
  });

  describe("Modal Structure", () => {
    it("should have correct modal backdrop styling", () => {
      const { container } = render(<CustomModal {...defaultProps} />);

      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass("z-5000", "flex", "items-center", "justify-center", "bg-black/50");
    });

    it("should have correct modal content dimensions", () => {
      const { container } = render(<CustomModal {...defaultProps} />);

      const modalContent = container.querySelector(".h-\\[625px\\].w-\\[900px\\]");
      expect(modalContent).toBeInTheDocument();
    });

    it("should render header with correct styling", () => {
      render(<CustomModal {...defaultProps} />);

      const header = screen.getByText("Test Modal");
      expect(header).toHaveClass("font-semibold", "text-lg");
    });

    it("should render footer with close button", () => {
      render(<CustomModal {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      const footer = closeButton.parentElement;
      expect(footer).toHaveClass("flex", "justify-end", "rounded-xl");
    });
  });

  describe("Text Customization", () => {
    it("should use custom loading text", () => {
      const customTexts = { ...defaultProps.texts, loading: "Cargando..." };
      render(<CustomModal {...defaultProps} texts={customTexts} iframeLoading={true} />);

      expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("should use custom no data text", () => {
      const customTexts = { ...defaultProps.texts, noData: "Sin datos" };
      render(<CustomModal {...defaultProps} texts={customTexts} url="" iframeLoading={false} />);

      expect(screen.getByText("Sin datos")).toBeInTheDocument();
    });

    it("should handle all text props correctly", () => {
      const customTexts = {
        loading: "Loading custom...",
        iframeTitle: "Custom Title",
        noData: "No data custom",
        closeButton: "Close custom",
      };
      render(<CustomModal {...defaultProps} texts={customTexts} />);

      expect(screen.getByText("Close custom")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("should transition from loading to loaded state", async () => {
      const { rerender } = render(<CustomModal {...defaultProps} iframeLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      rerender(<CustomModal {...defaultProps} iframeLoading={false} />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });
    });

    it("should handle opening and closing", () => {
      const { rerender } = render(<CustomModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();

      rerender(<CustomModal {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
    });

    it("should update URL when props change", () => {
      const { rerender } = render(<CustomModal {...defaultProps} url="https://old-url.com" />);

      let iframe = screen.getByTitle("Modal Content");
      expect(iframe).toHaveAttribute("src", "https://old-url.com");

      rerender(<CustomModal {...defaultProps} url="https://new-url.com" />);

      iframe = screen.getByTitle("Modal Content");
      expect(iframe).toHaveAttribute("src", "https://new-url.com");
    });

    it("should handle all states correctly in sequence", async () => {
      const handleIframeLoad = jest.fn();
      const handleClose = jest.fn();
      const { rerender } = render(
        <CustomModal
          {...defaultProps}
          iframeLoading={true}
          handleIframeLoad={handleIframeLoad}
          handleClose={handleClose}
        />
      );

      // Loading state
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // Loaded state
      rerender(
        <CustomModal
          {...defaultProps}
          iframeLoading={false}
          handleIframeLoad={handleIframeLoad}
          handleClose={handleClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Trigger iframe load
      const iframe = screen.getByTitle("Modal Content");
      fireEvent.load(iframe);
      expect(handleIframeLoad).toHaveBeenCalledTimes(1);

      // Close modal
      const closeButton = screen.getByTestId("close-button");
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title", () => {
      render(<CustomModal {...defaultProps} title="" />);

      expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("should render with minimal props", () => {
      const minimalProps = {
        isOpen: true,
        title: "Title",
        iframeLoading: false,
        url: "",
        handleClose: jest.fn(),
        texts: {
          closeButton: "Close",
        },
      };

      expect(() => {
        render(<CustomModal {...minimalProps} />);
      }).not.toThrow();
    });

    it("should handle undefined optional props gracefully", () => {
      const propsWithUndefined = {
        ...defaultProps,
        customContent: undefined,
        handleIframeLoad: undefined,
        customContentClass: undefined,
      };

      expect(() => {
        render(<CustomModal {...propsWithUndefined} />);
      }).not.toThrow();
    });

    it("should not render when closed and then opened again", () => {
      const { rerender } = render(<CustomModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();

      rerender(<CustomModal {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();

      rerender(<CustomModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button type", () => {
      render(<CustomModal {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveAttribute("type", "button");
    });

    it("should have iframe title for accessibility", () => {
      render(<CustomModal {...defaultProps} />);

      const iframe = screen.getByTitle("Modal Content");
      expect(iframe).toBeInTheDocument();
    });

    it("should be focusable on close button", () => {
      render(<CustomModal {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      closeButton.focus();

      expect(closeButton).toHaveFocus();
    });

    it("should have no border on iframe", () => {
      render(<CustomModal {...defaultProps} />);

      const iframe = screen.getByTitle("Modal Content");
      expect(iframe).toHaveClass("border-0");
    });
  });

  describe("Styling", () => {
    it("should have correct z-index for backdrop", () => {
      const { container } = render(<CustomModal {...defaultProps} />);

      const backdrop = container.querySelector(".z-5000");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have rounded corners on modal", () => {
      const { container } = render(<CustomModal {...defaultProps} />);

      const modalContent = container.querySelector(".rounded-xl");
      expect(modalContent).toBeInTheDocument();
    });

    it("should have proper spacing on header and footer", () => {
      const { container } = render(<CustomModal {...defaultProps} />);

      const header = container.querySelector(".p-4");
      expect(header).toBeInTheDocument();
    });

    it("should apply hover state to close button", () => {
      render(<CustomModal {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveClass("hover:bg-[var(--color-etendo-dark)]");
    });
  });
});
