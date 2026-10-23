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

import { renderHook } from "@testing-library/react";
import { useRecordNavigationShortcuts } from "@/hooks/useRecordNavigationShortcuts";
import { type KeyPress, appendElement, pressKey } from "@/utils/keyboard/test-utils/keyboardEvents";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";

const PREVIOUS: KeyPress = { key: "PageUp", alt: true, shift: true };
const NEXT: KeyPress = { key: "PageDown", alt: true, shift: true };

const renderNavigation = (enabled = true) => {
  const onPrevious = jest.fn();
  const onNext = jest.fn();
  renderHook(() => useRecordNavigationShortcuts({ onPrevious, onNext, enabled }));
  return { onPrevious, onNext };
};

describe("useRecordNavigationShortcuts", () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("runs the status bar previous and next handlers", () => {
    const { onPrevious, onNext } = renderNavigation();

    pressKey(PREVIOUS);
    pressKey(NEXT);

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("does not navigate from a text field", () => {
    const { onNext } = renderNavigation();

    pressKey(NEXT, appendElement("input"));

    expect(onNext).not.toHaveBeenCalled();
  });

  it("does not navigate while the form is not focused", () => {
    const { onPrevious } = renderNavigation(false);

    pressKey(PREVIOUS);

    expect(onPrevious).not.toHaveBeenCalled();
  });
});
