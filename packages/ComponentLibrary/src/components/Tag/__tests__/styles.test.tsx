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
import { useStyle } from "../styles";

const COLOR = "#123456";
const TEXT_COLOR = "#fafafa";

/** Reads the label rules of the chip for the given size. */
const getLabelRules = (size?: "small" | "medium") => {
  const { result } = renderHook(() => useStyle());
  return (result.current.sx.chipLabel(undefined, size) as Record<string, Record<string, unknown>>)["& .MuiChip-label"];
};

describe("Tag styles", () => {
  it("keeps the default dimensions for medium tags", () => {
    const { result } = renderHook(() => useStyle());

    expect(result.current.getChipStyles(COLOR, TEXT_COLOR)).toMatchObject({ height: "1.5rem", fontWeight: 500 });
    expect(getLabelRules()).toMatchObject({ fontSize: "0.875rem", lineHeight: "1.25rem" });
  });

  it("uses the dense dimensions for small tags", () => {
    const { result } = renderHook(() => useStyle());

    expect(result.current.getChipStyles(COLOR, TEXT_COLOR, "small")).toMatchObject({
      height: "1.25rem",
      fontWeight: 400,
      padding: "0 0.375rem",
    });
    expect(getLabelRules("small")).toMatchObject({ fontSize: "0.75rem", fontWeight: 400, lineHeight: "1rem" });
  });
});
