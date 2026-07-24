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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview Unit tests for DropdownPortal.
 *
 * Covers the viewport-relative positioning that fixes the horizontal-overflow
 * bug: the portal must use `position: fixed` (never `absolute`, which grew the
 * document and produced a spurious horizontal scrollbar), clamp itself inside
 * the viewport when the trigger is near the right edge, enforce a minimum width,
 * and flip above the trigger when there is no room below.
 */

import { render, screen } from "@testing-library/react";
import { DropdownPortal } from "../DropdownPortal";

const CONTENT_TESTID = "dropdown-content";
const MARGIN = 8;
const MIN_WIDTH = 256;
const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 768;

type Rect = { top: number; bottom: number; left: number; width: number };

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
};

const makeTriggerRef = ({ top, bottom, left, width }: Rect): React.RefObject<HTMLElement> => ({
  current: {
    getBoundingClientRect: () =>
      ({ top, bottom, left, width, right: left + width, height: bottom - top, x: left, y: top }) as DOMRect,
  } as HTMLElement,
});

const renderPortal = (rect: Rect, minWidth = MIN_WIDTH) => {
  render(
    <DropdownPortal isOpen triggerRef={makeTriggerRef(rect)} minWidth={minWidth}>
      <div data-testid={CONTENT_TESTID}>content</div>
    </DropdownPortal>
  );
  const portal = screen.getByTestId(CONTENT_TESTID).parentElement as HTMLElement;
  return portal;
};

const pxToNumber = (value: string) => Number.parseInt(value, 10);

describe("DropdownPortal", () => {
  beforeEach(() => {
    setViewport(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  });

  it("renders as a fixed-positioned portal (never absolute)", () => {
    const portal = renderPortal({ top: 100, bottom: 120, left: 100, width: 200 });

    expect(portal.className).toContain("fixed");
    expect(portal.className).not.toContain("absolute");
  });

  it("clamps left so the dropdown stays inside the right edge of the viewport", () => {
    // Trigger hugging the right edge; effective width is the 256px minimum.
    const portal = renderPortal({ top: 100, bottom: 120, left: 1000, width: 100 });

    const left = pxToNumber(portal.style.left);
    const width = pxToNumber(portal.style.width);
    expect(left + width).toBeLessThanOrEqual(VIEWPORT_WIDTH - MARGIN);
    expect(left).toBe(VIEWPORT_WIDTH - MIN_WIDTH - MARGIN); // 760
  });

  it("does not shift the dropdown when it already fits", () => {
    const portal = renderPortal({ top: 100, bottom: 120, left: 100, width: 300 });

    expect(portal.style.left).toBe("100px");
    expect(portal.style.width).toBe("300px");
  });

  it("enforces the minimum width for narrow triggers", () => {
    const portal = renderPortal({ top: 100, bottom: 120, left: 100, width: 50 });

    expect(portal.style.width).toBe(`${MIN_WIDTH}px`);
  });

  it("opens below the trigger when there is room", () => {
    const portal = renderPortal({ top: 100, bottom: 120, left: 100, width: 300 });

    expect(portal.style.top).toBe("124px"); // bottom (120) + GAP (4)
    expect(portal.style.transform).toBe("");
  });

  describe("vertical flip", () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

    beforeAll(() => {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, value: 250 });
    });

    afterAll(() => {
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      }
    });

    it("flips above the trigger when there is no room below", () => {
      // Trigger near the bottom: little space below, plenty above.
      const portal = renderPortal({ top: 740, bottom: 760, left: 100, width: 300 });

      expect(portal.style.transform).toBe("translateY(-100%)");
      expect(portal.style.top).toBe("736px"); // top (740) - GAP (4)
    });
  });

  it("renders nothing when closed", () => {
    render(
      <DropdownPortal isOpen={false} triggerRef={makeTriggerRef({ top: 100, bottom: 120, left: 100, width: 200 })}>
        <div data-testid={CONTENT_TESTID}>content</div>
      </DropdownPortal>
    );

    expect(screen.queryByTestId(CONTENT_TESTID)).toBeNull();
  });
});
