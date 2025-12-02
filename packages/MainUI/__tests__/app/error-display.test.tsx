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

import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorDisplay } from "@/components/ErrorDisplay";

// Mock dependencies
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  },
}));

jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("@mui/material", () => ({
  Button: function MockButton({ children, onClick, ...props }: any) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errors.internalServerError.retry": "Retry",
        "navigation.common.home": "Go Home",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ErrorDisplay Component", () => {
  const defaultProps = {
    title: "Error Title",
  };

  it("should render with title only", () => {
    render(<ErrorDisplay {...defaultProps} />);

    expect(screen.getByText("Error Title")).toBeInTheDocument();
  });

  it("should render with title and description", () => {
    render(<ErrorDisplay {...defaultProps} description="Error description text" />);

    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Error description text")).toBeInTheDocument();
  });

  it("should render error image", () => {
    render(<ErrorDisplay {...defaultProps} />);

    const image = screen.getByTestId("Image__2e88cf");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("alt", "Error");
  });

  it("should not render description when not provided", () => {
    const { container } = render(<ErrorDisplay {...defaultProps} />);

    const description = container.querySelector("p");
    expect(description).not.toBeInTheDocument();
  });

  describe("Retry Button", () => {
    it("should not render retry button by default", () => {
      render(<ErrorDisplay {...defaultProps} />);

      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });

    it("should render retry button when showRetry is true and onRetry is provided", () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay {...defaultProps} showRetry={true} onRetry={onRetry} />);

      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("should call onRetry when retry button is clicked", () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay {...defaultProps} showRetry={true} onRetry={onRetry} />);

      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should not render retry button when showRetry is true but onRetry is not provided", () => {
      render(<ErrorDisplay {...defaultProps} showRetry={true} />);

      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });
  });

  describe("Home Button", () => {
    it("should not render home button by default", () => {
      render(<ErrorDisplay {...defaultProps} />);

      expect(screen.queryByText("Go Home")).not.toBeInTheDocument();
    });

    it("should render home button when showHomeButton is true", () => {
      render(<ErrorDisplay {...defaultProps} showHomeButton={true} />);

      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });

    it("should render home button with correct link", () => {
      render(<ErrorDisplay {...defaultProps} showHomeButton={true} />);

      const link = screen.getByTestId("Link__2e88cf");
      expect(link).toHaveAttribute("href", "/");
    });
  });

  describe("Children", () => {
    it("should render custom children", () => {
      render(
        <ErrorDisplay {...defaultProps}>
          <div data-testid="custom-child">Custom Content</div>
        </ErrorDisplay>
      );

      expect(screen.getByTestId("custom-child")).toBeInTheDocument();
      expect(screen.getByText("Custom Content")).toBeInTheDocument();
    });

    it("should render children between description and buttons", () => {
      const { container } = render(
        <ErrorDisplay {...defaultProps} description="Description" showRetry onRetry={jest.fn()}>
          <div data-testid="custom-child">Custom Content</div>
        </ErrorDisplay>
      );

      const description = screen.getByText("Description");
      const customChild = screen.getByTestId("custom-child");
      const retryButton = screen.getByText("Retry");

      expect(description).toBeInTheDocument();
      expect(customChild).toBeInTheDocument();
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should have correct wrapper styling", () => {
      const { container } = render(<ErrorDisplay {...defaultProps} />);

      const wrapper = container.querySelector(".w-full.max-w-md.p-8");
      expect(wrapper).toBeInTheDocument();
    });

    it("should center content", () => {
      const { container } = render(<ErrorDisplay {...defaultProps} />);

      const wrapper = container.querySelector(".flex.flex-col.items-center");
      expect(wrapper).toBeInTheDocument();
    });

    it("should have button container", () => {
      render(<ErrorDisplay {...defaultProps} showRetry onRetry={jest.fn()} />);

      const { container } = render(<ErrorDisplay {...defaultProps} showRetry onRetry={jest.fn()} />);
      const buttonContainer = container.querySelector(".flex.flex-col.sm\\:flex-row.gap-3.mt-2.w-full.justify-center");
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe("Combined Scenarios", () => {
    it("should render both retry and home buttons", () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay {...defaultProps} showRetry onRetry={onRetry} showHomeButton />);

      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });

    it("should render all elements together", () => {
      const onRetry = jest.fn();
      render(
        <ErrorDisplay title="Error Title" description="Error Description" showRetry onRetry={onRetry} showHomeButton>
          <div data-testid="custom-child">Custom Content</div>
        </ErrorDisplay>
      );

      expect(screen.getByText("Error Title")).toBeInTheDocument();
      expect(screen.getByText("Error Description")).toBeInTheDocument();
      expect(screen.getByTestId("custom-child")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });
  });

  describe("Image Properties", () => {
    it("should render image with testid", () => {
      render(<ErrorDisplay {...defaultProps} />);

      const image = screen.getByTestId("Image__2e88cf");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("alt", "Error");
    });

    it("should have correct image dimensions", () => {
      render(<ErrorDisplay {...defaultProps} />);

      const image = screen.getByTestId("Image__2e88cf");
      expect(image).toHaveAttribute("width", "240");
      expect(image).toHaveAttribute("height", "240");
    });
  });

  describe("Button TestIds", () => {
    it("should have correct data-testid for retry button", () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay {...defaultProps} showRetry onRetry={onRetry} />);

      const button = screen.getByTestId("Button__2e88cf");
      expect(button).toBeInTheDocument();
    });

    it("should have correct data-testid for home button", () => {
      render(<ErrorDisplay {...defaultProps} showHomeButton />);

      const button = screen.getByTestId("Button__2e88cf");
      expect(button).toBeInTheDocument();
    });
  });
});
