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

import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(main)/page";
import LoadingScreen from "@/app/loading";
import NotFound from "@/app/not-found";

// Mock dependencies
jest.mock("@/app/(main)/window/page", () => {
  return function MockPage(props: any) {
    return (
      <div {...props} data-testid="mock-window-page">
        Window Page
      </div>
    );
  };
});

jest.mock("@/components/loading", () => {
  return function MockLoading({ ...props }) {
    return <div {...props}>Loading Component</div>;
  };
});

jest.mock("@/components/ErrorDisplay", () => {
  return {
    ErrorDisplay: function MockErrorDisplay({ title, description, children, ...props }: any) {
      return (
        <div {...props}>
          <h2>{title}</h2>
          <p>{description}</p>
          {children}
        </div>
      );
    },
  };
});

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
  Button: function MockButton({ children, ...props }: any) {
    return <button {...props}>{children}</button>;
  },
  CircularProgress: function MockCircularProgress(props: any) {
    return <div {...props}>Loading...</div>;
  },
}));

jest.mock("@/utils/language", () => ({
  getLanguage: jest.fn(() => "en"),
  t: jest.fn((lang: string, key: string) => {
    const translations: Record<string, string> = {
      "errors.notFound.title": "Page Not Found",
      "errors.notFound.description": "The page you are looking for does not exist",
      "navigation.common.home": "Home",
    };
    return translations[key] || key;
  }),
}));

describe("App Root Pages", () => {
  describe("HomePage", () => {
    it("should render the Page component with correct data-testid", () => {
      render(<HomePage />);

      // The HomePage passes data-testid="Page__90ddba" to the Page component
      // but our mock overwrites it with "mock-window-page"
      const pageElement = screen.getByTestId("mock-window-page");
      expect(pageElement).toBeInTheDocument();
      expect(pageElement).toHaveTextContent("Window Page");
    });

    it("should render mock window page content", () => {
      render(<HomePage />);

      expect(screen.getByTestId("mock-window-page")).toBeInTheDocument();
      expect(screen.getByText("Window Page")).toBeInTheDocument();
    });
  });

  describe("LoadingScreen", () => {
    it("should render Loading component", () => {
      render(<LoadingScreen />);

      const loadingElement = screen.getByTestId("Loading__df1398");
      expect(loadingElement).toBeInTheDocument();
    });

    it("should pass data-testid to Loading component", () => {
      render(<LoadingScreen />);

      expect(screen.getByTestId("Loading__df1398")).toHaveTextContent("Loading Component");
    });
  });

  describe("NotFound", () => {
    it("should render ErrorDisplay with not found title", () => {
      render(<NotFound />);

      expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    });

    it("should render ErrorDisplay with not found description", () => {
      render(<NotFound />);

      expect(screen.getByText("The page you are looking for does not exist")).toBeInTheDocument();
    });

    it("should render home button with correct link", () => {
      render(<NotFound />);

      const link = screen.getByTestId("Link__febd85");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/");
    });

    it("should render home button with correct text", () => {
      render(<NotFound />);

      const button = screen.getByTestId("Button__febd85");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Home");
    });

    it("should have proper wrapper structure", () => {
      const { container } = render(<NotFound />);

      const wrapper = container.querySelector(".w-full.min-h-full.flex.items-center.justify-center");
      expect(wrapper).toBeInTheDocument();
    });

    it("should pass data-testid to ErrorDisplay", () => {
      render(<NotFound />);

      expect(screen.getByTestId("ErrorDisplay__febd85")).toBeInTheDocument();
    });
  });
  describe("Loading Component (mocked)", () => {
    it("should render mocked Loading component with default props", () => {
      render(<LoadingScreen />);

      const loadingElement = screen.getByTestId("Loading__df1398");
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveTextContent("Loading Component");
    });

    it("should verify Loading component is being used", () => {
      render(<LoadingScreen />);

      expect(screen.getByText("Loading Component")).toBeInTheDocument();
    });
  });
});
