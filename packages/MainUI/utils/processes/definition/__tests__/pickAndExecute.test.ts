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

import type { ProcessDefinition, Tab } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  PICK_AND_EXECUTE_UI_PATTERN,
  allowsMultipleRecords,
  isPickAndExecute,
  tabAllowsMultipleSelection,
} from "../pickAndExecute";

const WINDOW_REF = FIELD_REFERENCE_CODES.WINDOW.id;

const buildProcess = (overrides: Partial<ProcessDefinition> = {}): ProcessDefinition => ({
  id: "P1",
  name: "Sample",
  javaClassName: "com.example.Handler",
  parameters: {},
  onLoad: "",
  onProcess: "",
  ...overrides,
});

describe("isPickAndExecute", () => {
  it("returns true when uIPattern is the explicit P&E discriminator", () => {
    const process = buildProcess({ uIPattern: PICK_AND_EXECUTE_UI_PATTERN });
    expect(isPickAndExecute(process)).toBe(true);
  });

  it("returns true via fallback when a Window Reference parameter exists but uIPattern is absent", () => {
    const process = buildProcess({
      parameters: {
        // biome-ignore lint/suspicious/noExplicitAny: minimal fixture for predicate
        gridParam: { reference: WINDOW_REF } as any,
      },
    });
    expect(isPickAndExecute(process)).toBe(true);
  });

  it("returns false when neither uIPattern nor a Window Reference parameter is present", () => {
    const process = buildProcess({
      parameters: {
        // biome-ignore lint/suspicious/noExplicitAny: minimal fixture for predicate
        plainParam: { reference: "10" } as any,
      },
    });
    expect(isPickAndExecute(process)).toBe(false);
  });

  it("returns false for a process with no parameters and no uIPattern", () => {
    expect(isPickAndExecute(buildProcess())).toBe(false);
  });

  it("returns false for null/undefined input", () => {
    expect(isPickAndExecute(null)).toBe(false);
    expect(isPickAndExecute(undefined)).toBe(false);
  });

  it("ignores a non-P&E uIPattern and falls back to the parameter check", () => {
    const process = buildProcess({
      uIPattern: "STD",
      parameters: {
        // biome-ignore lint/suspicious/noExplicitAny: minimal fixture for predicate
        gridParam: { reference: WINDOW_REF } as any,
      },
    });
    expect(isPickAndExecute(process)).toBe(true);
  });
});

describe("allowsMultipleRecords", () => {
  it("returns the boolean directly when isMultiRecord is true/false", () => {
    expect(allowsMultipleRecords(buildProcess({ isMultiRecord: true }))).toBe(true);
    expect(allowsMultipleRecords(buildProcess({ isMultiRecord: false }))).toBe(false);
  });

  it("normalizes the legacy 'Y'/'N' strings", () => {
    expect(allowsMultipleRecords(buildProcess({ isMultiRecord: "Y" }))).toBe(true);
    expect(allowsMultipleRecords(buildProcess({ isMultiRecord: "N" }))).toBe(false);
  });

  it("defaults to true when isMultiRecord is absent", () => {
    expect(allowsMultipleRecords(buildProcess())).toBe(true);
  });

  it("defaults to true for null/undefined input", () => {
    expect(allowsMultipleRecords(null)).toBe(true);
    expect(allowsMultipleRecords(undefined)).toBe(true);
  });
});

const buildTab = (overrides: Partial<Tab> = {}): Tab => ({ ...overrides }) as Tab;

describe("tabAllowsMultipleSelection", () => {
  it("returns true when obuiappSelectionType is 'M'", () => {
    expect(tabAllowsMultipleSelection(buildTab({ obuiappSelectionType: "M" }))).toBe(true);
  });

  it("returns false when obuiappSelectionType is 'S'", () => {
    expect(tabAllowsMultipleSelection(buildTab({ obuiappSelectionType: "S" }))).toBe(false);
  });

  it("returns false when obuiappSelectionType is 'N'", () => {
    expect(tabAllowsMultipleSelection(buildTab({ obuiappSelectionType: "N" }))).toBe(false);
  });

  it("defaults to true when obuiappSelectionType is null or absent", () => {
    expect(tabAllowsMultipleSelection(buildTab({ obuiappSelectionType: null }))).toBe(true);
    expect(tabAllowsMultipleSelection(buildTab())).toBe(true);
  });

  it("defaults to true for null/undefined tab", () => {
    expect(tabAllowsMultipleSelection(null)).toBe(true);
    expect(tabAllowsMultipleSelection(undefined)).toBe(true);
  });
});
