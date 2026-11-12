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

import { getStoredPreference } from "@/utils/propertyStore";
import {
  DEFAULT_PROCESS_FILE_UPLOAD_MAX_SIZE_MB,
  findOversizedFile,
  getProcessFileUploadMaxSize,
  PROCESS_FILE_UPLOAD_MAX_SIZE_PREFERENCE,
} from "../fileUploadMaxSize";

jest.mock("@/utils/propertyStore", () => ({ getStoredPreference: jest.fn() }));

const MEGABYTE = 1024 * 1024;

const makeFile = (name: string, size: number) => {
  const file = new File([], name);
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("getProcessFileUploadMaxSize", () => {
  const storePreference = (value: string | undefined) => (getStoredPreference as jest.Mock).mockReturnValue(value);

  it("reads the preference in MB", () => {
    storePreference("5");
    expect(getProcessFileUploadMaxSize()).toBe(5);
    expect(getStoredPreference).toHaveBeenCalledWith(PROCESS_FILE_UPLOAD_MAX_SIZE_PREFERENCE);
  });

  it("applies the server's default when the preference is not set", () => {
    storePreference(undefined);
    expect(getProcessFileUploadMaxSize()).toBe(DEFAULT_PROCESS_FILE_UPLOAD_MAX_SIZE_MB);
  });

  it.each(["abc", "-1"])("sets no limit for the value %s, as Classic", (value) => {
    storePreference(value);
    expect(getProcessFileUploadMaxSize()).toBeNull();
  });
});

describe("findOversizedFile", () => {
  const small = makeFile("small.p12", MEGABYTE);
  const exact = makeFile("exact.p12", 10 * MEGABYTE);
  const large = makeFile("large.p12", 15 * MEGABYTE);

  it("returns the first file above the limit", () => {
    expect(findOversizedFile({ a: small, b: large }, 10)).toBe(large);
  });

  it("accepts a file of exactly the maximum size", () => {
    expect(findOversizedFile({ a: small, b: exact }, 10)).toBeUndefined();
  });

  it("accepts every file when there is no limit", () => {
    expect(findOversizedFile({ a: large }, null)).toBeUndefined();
  });
});
