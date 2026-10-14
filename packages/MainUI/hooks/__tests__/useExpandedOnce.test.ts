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
import { useExpandedOnce } from "../useExpandedOnce";

const RECORD_A = "record-a";
const RECORD_B = "record-b";

const renderExpandedOnce = (isExpanded: boolean, resetKey = RECORD_A) =>
  renderHook(({ expanded, key }) => useExpandedOnce(expanded, key), {
    initialProps: { expanded: isExpanded, key: resetKey },
  });

describe("useExpandedOnce", () => {
  it("returns false while the section has never been expanded", () => {
    const { result } = renderExpandedOnce(false);
    expect(result.current).toBe(false);
  });

  it("returns true as soon as the section is expanded", () => {
    const { result } = renderExpandedOnce(true);
    expect(result.current).toBe(true);
  });

  it("keeps returning true after the section is collapsed for the same key", () => {
    const { result, rerender } = renderExpandedOnce(true);
    rerender({ expanded: false, key: RECORD_A });
    expect(result.current).toBe(true);
  });

  it("releases the latch when the key changes while collapsed", () => {
    const { result, rerender } = renderExpandedOnce(true);
    rerender({ expanded: false, key: RECORD_A });
    rerender({ expanded: false, key: RECORD_B });
    expect(result.current).toBe(false);
  });

  it("returns true immediately when the key changes while expanded", () => {
    const { result, rerender } = renderExpandedOnce(true);
    rerender({ expanded: true, key: RECORD_B });
    expect(result.current).toBe(true);
  });
});
