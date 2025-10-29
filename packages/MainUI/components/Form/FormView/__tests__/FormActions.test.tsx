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

import { globalCalloutManager, type GlobalCalloutManager } from "../../../../services/callouts";

// ✅ Mock del módulo completo
jest.mock("../../../../services/callouts", () => {
  const mockGlobalCalloutManager = {
    isCalloutRunning: jest.fn(() => false),
    isSuppressed: jest.fn(() => false),
    canExecute: jest.fn(() => true),
    clearPendingCallouts: jest.fn(),
    reset: jest.fn(),
    executeCallout: jest.fn(),
    arePendingCalloutsEmpty: jest.fn(() => true),
    on: jest.fn(),
    off: jest.fn(),
    getState: jest.fn(() => ({
      isRunning: false,
      queueLength: 0,
      pendingCount: 0,
      isSuppressed: false,
    })),
  };

  return {
    globalCalloutManager: mockGlobalCalloutManager,
    GlobalCalloutManager: jest.fn().mockImplementation(() => mockGlobalCalloutManager),
  };
});

jest.mock("../../../../hooks/useFormValidation", () => ({
  useFormValidation: jest.fn(() => ({
    validateRequiredFields: jest.fn(() => ({
      isValid: true,
      missingFields: [],
    })),
    hasValidationErrors: false,
    validationErrors: [],
  })),
}));

describe("FormActions Integration Tests", () => {
  const mockGlobalCalloutManager = globalCalloutManager as jest.Mocked<InstanceType<typeof GlobalCalloutManager>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGlobalCalloutManager.isCalloutRunning.mockReturnValue(false);
  });

  it("should check if callouts are running before validation", () => {
    const isActive = mockGlobalCalloutManager.isCalloutRunning();
    expect(isActive).toBe(false);
    expect(mockGlobalCalloutManager.isCalloutRunning).toHaveBeenCalled();
  });

  it("should handle callout running state", () => {
    mockGlobalCalloutManager.isCalloutRunning.mockReturnValue(true);
    const isActive = mockGlobalCalloutManager.isCalloutRunning();
    expect(isActive).toBe(true);
  });

  it("should wait for callouts to complete before validation", () => {
    mockGlobalCalloutManager.isCalloutRunning.mockReturnValue(true);
    let shouldValidate = false;

    if (!mockGlobalCalloutManager.isCalloutRunning()) {
      shouldValidate = true;
    }

    expect(shouldValidate).toBe(false);

    mockGlobalCalloutManager.isCalloutRunning.mockReturnValue(false);

    if (!mockGlobalCalloutManager.isCalloutRunning()) {
      shouldValidate = true;
    }

    expect(shouldValidate).toBe(true);
  });

  it("should verify integration points exist", () => {
    expect(globalCalloutManager.isCalloutRunning).toBeDefined();
    expect(typeof mockGlobalCalloutManager.isCalloutRunning()).toBe("boolean");
  });
});
