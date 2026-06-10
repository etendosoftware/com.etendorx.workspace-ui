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
 * @fileoverview Unit tests for useFormDefaultsSync.
 *
 * Covers the process-modal defaults synchronization: applying async backend
 * defaults to the form while preserving values written by onLoad/onChange
 * scripts (the regression behind the "Funds Transfer" empty Description field).
 */

import { act, renderHook } from "@testing-library/react";
import { type FieldValues, useForm } from "react-hook-form";
import { useFormDefaultsSync } from "../useFormDefaultsSync";

const FIELD_DESC = "Description";
const FIELD_OTHER = "otherField";
const SCRIPT_VALUE = "Funds Transfer Transaction";
const NEW_OTHER = "backend-default";

/**
 * Renders the hook driving a real react-hook-form instance (started empty) so
 * the assertions exercise RHF's actual reset/keepDirtyValues behaviour. The
 * `defaults` prop can be changed via `rerender` to simulate late-arriving
 * backend defaults.
 */
const renderDefaultsSync = (defaults: FieldValues) =>
  renderHook(
    ({ d }: { d: FieldValues }) => {
      const form = useForm<FieldValues>({ defaultValues: {} });
      useFormDefaultsSync(form, d);
      return form;
    },
    { initialProps: { d: defaults } }
  );

describe("useFormDefaultsSync", () => {
  it("applies the defaults to clean fields when data is present", () => {
    const { result } = renderDefaultsSync({ [FIELD_DESC]: SCRIPT_VALUE });

    expect(result.current.getValues(FIELD_DESC)).toBe(SCRIPT_VALUE);
  });

  it("does not reset the form when there is no available data", () => {
    const { result, rerender } = renderDefaultsSync({});

    act(() => {
      result.current.setValue(FIELD_OTHER, NEW_OTHER, { shouldDirty: false });
    });
    rerender({ d: {} });

    // An empty payload must be ignored: a non-dirty value would be wiped by a
    // reset, so its survival proves the reset was skipped.
    expect(result.current.getValues(FIELD_OTHER)).toBe(NEW_OTHER);
  });

  it("preserves a script-set (dirty) field across a later defaults change", () => {
    const { result, rerender } = renderDefaultsSync({ [FIELD_DESC]: "", [FIELD_OTHER]: "" });

    // Simulates the onLoad script: view.theForm.getItem('description').setValue(label)
    act(() => {
      result.current.setValue(FIELD_DESC, SCRIPT_VALUE, { shouldDirty: true });
    });

    // Async backend defaults arrive afterwards.
    rerender({ d: { [FIELD_DESC]: "", [FIELD_OTHER]: NEW_OTHER } });

    expect(result.current.getValues(FIELD_DESC)).toBe(SCRIPT_VALUE);
    expect(result.current.getValues(FIELD_OTHER)).toBe(NEW_OTHER);
  });

  it("updates clean fields when new defaults arrive", () => {
    const { result, rerender } = renderDefaultsSync({ [FIELD_OTHER]: "old" });

    rerender({ d: { [FIELD_OTHER]: NEW_OTHER } });

    expect(result.current.getValues(FIELD_OTHER)).toBe(NEW_OTHER);
  });
});
