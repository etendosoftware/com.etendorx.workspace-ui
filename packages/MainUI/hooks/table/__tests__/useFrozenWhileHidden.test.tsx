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

import { renderHook } from "@testing-library/react";
import { useFrozenWhileHidden } from "../useFrozenWhileHidden";

describe("useFrozenWhileHidden", () => {
  it("follows the value while visible", () => {
    const { result, rerender } = renderHook(({ visible, value }) => useFrozenWhileHidden(visible, value), {
      initialProps: { visible: true, value: "a" },
    });
    rerender({ visible: true, value: "b" });
    expect(result.current).toBe("b");
  });

  it("keeps the last visible value while hidden", () => {
    const first = { rows: 1 };
    const { result, rerender } = renderHook(({ visible, value }) => useFrozenWhileHidden(visible, value), {
      initialProps: { visible: true, value: first },
    });
    rerender({ visible: false, value: { rows: 2 } });
    rerender({ visible: false, value: { rows: 3 } });
    expect(result.current).toBe(first);
  });

  it("returns the current value again once visible", () => {
    const { result, rerender } = renderHook(({ visible, value }) => useFrozenWhileHidden(visible, value), {
      initialProps: { visible: true, value: "a" },
    });
    rerender({ visible: false, value: "b" });
    rerender({ visible: true, value: "c" });
    expect(result.current).toBe("c");
  });

  it("takes the new value while hidden when a refresh key changes", () => {
    const rows = ["r1"];
    const { result, rerender } = renderHook(({ visible, value, keys }) => useFrozenWhileHidden(visible, value, keys), {
      initialProps: { visible: true, value: "a", keys: [rows] as unknown[] },
    });
    rerender({ visible: false, value: "b", keys: [rows] });
    expect(result.current).toBe("a");
    const refetched = ["r1", "r2"];
    rerender({ visible: false, value: "c", keys: [refetched] });
    expect(result.current).toBe("c");
    rerender({ visible: false, value: "d", keys: [refetched] });
    expect(result.current).toBe("c");
  });

  it("uses the first value when it mounts hidden", () => {
    const { result, rerender } = renderHook(({ visible, value }) => useFrozenWhileHidden(visible, value), {
      initialProps: { visible: false, value: "a" },
    });
    rerender({ visible: false, value: "b" });
    expect(result.current).toBe("a");
  });
});
