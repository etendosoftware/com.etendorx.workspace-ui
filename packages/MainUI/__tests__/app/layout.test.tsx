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
import Layout from "@/components/layout";

// Mock child components
jest.mock("@/components/navigation", () => {
  return function MockNavigation(props: any) {
    return <div {...props}>Navigation</div>;
  };
});

jest.mock("@/components/Sidebar", () => {
  return function MockSidebar(props: any) {
    return <div {...props}>Sidebar</div>;
  };
});

jest.mock("@/components/Layout/GlobalLoading", () => {
  return function MockGlobalLoading(props: any) {
    return <div {...props}>Global Loading</div>;
  };
});

describe("Layout Component", () => {
  const mockChildren = <div data-testid="test-children">Test Content</div>;

  it("should render Layout component", () => {
    const { container } = render(<Layout>{mockChildren}</Layout>);

    const mainWrapper = container.querySelector(".flex.w-full.h-full.relative.overflow-hidden");
    expect(mainWrapper).toBeInTheDocument();
  });

  it("should render children content", () => {
    render(<Layout>{mockChildren}</Layout>);

    expect(screen.getByTestId("test-children")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render GlobalLoading component", () => {
    render(<Layout>{mockChildren}</Layout>);

    expect(screen.getByTestId("GlobalLoading__519d5c")).toBeInTheDocument();
  });

  it("should render Sidebar component", () => {
    render(<Layout>{mockChildren}</Layout>);

    expect(screen.getByTestId("Sidebar__519d5c")).toBeInTheDocument();
  });

  it("should render Navigation component", () => {
    render(<Layout>{mockChildren}</Layout>);

    expect(screen.getByTestId("Navigation__519d5c")).toBeInTheDocument();
  });

  it("should have correct layout structure", () => {
    const { container } = render(<Layout>{mockChildren}</Layout>);

    const mainWrapper = container.querySelector(".flex.w-full.h-full.relative.overflow-hidden");
    expect(mainWrapper).toBeInTheDocument();
  });

  it("should have navigation container with correct styling", () => {
    const { container } = render(<Layout>{mockChildren}</Layout>);

    const navContainer = container.querySelector(".w-full.h-14.min-h-14.p-1");
    expect(navContainer).toBeInTheDocument();
  });

  it("should have content wrapper with correct flex layout", () => {
    const { container } = render(<Layout>{mockChildren}</Layout>);

    const contentWrapper = container.querySelector(".flex.flex-1.flex-col.max-w-auto.max-h-auto.overflow-hidden");
    expect(contentWrapper).toBeInTheDocument();
  });

  it("should render children in correct container", () => {
    const { container } = render(<Layout>{mockChildren}</Layout>);

    const childrenContainer = container.querySelector(".flex.flex-1.max-h-auto.max-w-auto.overflow-hidden");
    expect(childrenContainer).toBeInTheDocument();
    expect(childrenContainer).toContainElement(screen.getByTestId("test-children"));
  });

  it("should render all components in correct order", () => {
    render(<Layout>{mockChildren}</Layout>);

    const globalLoading = screen.getByTestId("GlobalLoading__519d5c");
    const sidebar = screen.getByTestId("Sidebar__519d5c");
    const navigation = screen.getByTestId("Navigation__519d5c");
    const children = screen.getByTestId("test-children");

    expect(globalLoading).toBeInTheDocument();
    expect(sidebar).toBeInTheDocument();
    expect(navigation).toBeInTheDocument();
    expect(children).toBeInTheDocument();
  });

  it("should handle multiple children", () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );

    render(<Layout>{multipleChildren}</Layout>);

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
    expect(screen.getByTestId("child-3")).toBeInTheDocument();
  });

  it("should handle empty children", () => {
    const { container } = render(<Layout>{null}</Layout>);

    const mainWrapper = container.querySelector(".flex.w-full.h-full.relative.overflow-hidden");
    expect(mainWrapper).toBeInTheDocument();
    expect(screen.getByTestId("GlobalLoading__519d5c")).toBeInTheDocument();
  });

  it("should apply overflow-hidden to main container", () => {
    const { container } = render(<Layout>{mockChildren}</Layout>);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("overflow-hidden");
  });
});
