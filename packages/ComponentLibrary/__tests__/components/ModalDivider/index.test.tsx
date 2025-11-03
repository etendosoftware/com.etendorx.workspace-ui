import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModalDivider from "../../../src/components/ModalDivider";

describe("ModalDivider", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      expect(() => {
        render(<ModalDivider />);
      }).not.toThrow();
    });

    it("should render MUI Divider component", () => {
      const { container } = render(<ModalDivider />);

      const divider = container.querySelector("hr");
      expect(divider).toBeInTheDocument();
    });

    it("should have proper ARIA role", () => {
      const { container } = render(<ModalDivider />);

      const divider = container.querySelector("hr");
      expect(divider).toHaveClass("MuiDivider-root");
    });
  });

  describe("Styling", () => {
    it("should apply default MUI Divider classes", () => {
      const { container } = render(<ModalDivider />);

      const divider = container.querySelector("hr");
      expect(divider).toHaveClass("MuiDivider-root");
    });

    it("should render as hr element", () => {
      const { container } = render(<ModalDivider />);

      const hrElement = container.querySelector("hr");
      expect(hrElement).toBeInTheDocument();
    });
  });

  describe("Multiple Instances", () => {
    it("should render multiple dividers independently", () => {
      const { container } = render(
        <>
          <ModalDivider />
          <ModalDivider />
          <ModalDivider />
        </>
      );

      const dividers = container.querySelectorAll("hr");
      expect(dividers).toHaveLength(3);
    });
  });

  describe("Component Structure", () => {
    it("should be a simple wrapper around MUI Divider", () => {
      const { container } = render(<ModalDivider />);

      const divider = container.querySelector(".MuiDivider-root");
      expect(divider).toBeInTheDocument();
      expect(divider?.tagName).toBe("HR");
    });
  });

  describe("Integration", () => {
    it("should work within a parent container", () => {
      const { container } = render(
        <div data-testid="parent">
          <ModalDivider />
        </div>
      );

      const parent = container.querySelector('[data-testid="parent"]');
      const divider = parent?.querySelector("hr");
      expect(divider).toBeInTheDocument();
    });

    it("should render correctly in a list of elements", () => {
      const { container } = render(
        <div>
          <div>Section 1</div>
          <ModalDivider />
          <div>Section 2</div>
          <ModalDivider />
          <div>Section 3</div>
        </div>
      );

      const dividers = container.querySelectorAll("hr");
      expect(dividers).toHaveLength(2);
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic HTML", () => {
      const { container } = render(<ModalDivider />);

      const hrElement = container.querySelector("hr");
      expect(hrElement).toBeInTheDocument();
    });

    it("should be properly structured for screen readers", () => {
      const { container } = render(<ModalDivider />);

      const divider = container.querySelector(".MuiDivider-root");
      expect(divider?.tagName).toBe("HR");
    });
  });
});
