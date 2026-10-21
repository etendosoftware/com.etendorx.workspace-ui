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

import { act, renderHook } from "@testing-library/react";
import { useSaveAsDefault } from "../useSaveAsDefault";

const checkboxEvent = (checked: boolean) => ({ target: { checked } }) as React.ChangeEvent<HTMLInputElement>;

describe("useSaveAsDefault", () => {
  it("starts unticked", () => {
    const { result } = renderHook(() => useSaveAsDefault());
    expect(result.current.saveAsDefault).toBe(false);
  });

  it.each([true, false])("follows the checkbox when it is set to %s", (checked) => {
    const { result } = renderHook(() => useSaveAsDefault());
    act(() => result.current.onSaveAsDefaultChange(checkboxEvent(!checked)));
    act(() => result.current.onSaveAsDefaultChange(checkboxEvent(checked)));
    expect(result.current.saveAsDefault).toBe(checked);
  });

  it("unticks once a profile change is applied, so the next change is not saved as default", () => {
    const { result } = renderHook(() => useSaveAsDefault());
    act(() => result.current.onSaveAsDefaultChange(checkboxEvent(true)));
    act(() => result.current.onProfileApplied());
    expect(result.current.saveAsDefault).toBe(false);
  });
});
