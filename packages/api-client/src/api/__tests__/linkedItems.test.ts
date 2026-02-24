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

import { fetchLinkedItemCategories, fetchLinkedItems } from "../linkedItems";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      post: jest.fn(),
    },
  },
}));

describe("api/linkedItems", () => {
  describe("fetchLinkedItemCategories", () => {
    it("successfully fetches categories", async () => {
      const mockData = {
        usedByLinkData: [{ id: "cat1", name: "Category 1" }],
      };
      (Metadata.client.post as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockData,
      });

      const params = {
        windowId: "W1",
        entityName: "Product",
        recordId: "R1",
      };

      const result = await fetchLinkedItemCategories(params);

      expect(Metadata.client.post).toHaveBeenCalledWith(
        "meta/utility/UsedByLink.html",
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
      );

      const sentBody = (Metadata.client.post as jest.Mock).mock.calls[0][1] as URLSearchParams;
      expect(sentBody.get("Command")).toBe("JSONCategory");
      expect(sentBody.get("recordId")).toBe("R1");
      expect(sentBody.get("inpkeyW1")).toBe("R1");

      expect(result).toEqual(mockData.usedByLinkData);
    });

    it("throws error when API call fails", async () => {
      (Metadata.client.post as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchLinkedItemCategories({ windowId: "W1", entityName: "E1", recordId: "R1" })).rejects.toThrow(
        "Error fetching linked item categories: API call failed with status 500"
      );
    });
  });

  describe("fetchLinkedItems", () => {
    it("successfully fetches linked items", async () => {
      const mockData = {
        usedByLinkData: [{ id: "item1", name: "Item 1" }],
      };
      (Metadata.client.post as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockData,
      });

      const params = {
        windowId: "W1",
        entityName: "Product",
        recordId: "R1",
        adTabId: "T1",
        tableName: "Table1",
        columnName: "Col1",
      };

      const result = await fetchLinkedItems(params);

      expect(Metadata.client.post).toHaveBeenCalledWith(
        "meta/utility/UsedByLink.html",
        expect.any(URLSearchParams),
        expect.any(Object)
      );

      const sentBody = (Metadata.client.post as jest.Mock).mock.calls[0][1] as URLSearchParams;
      expect(sentBody.get("Command")).toBe("JSONLinkedItem");
      expect(sentBody.get("tableName")).toBe("Table1");

      expect(result).toEqual(mockData.usedByLinkData);
    });

    it("throws error when API call fails", async () => {
      (Metadata.client.post as jest.Mock).mockRejectedValue(new Error("Network Error"));

      await expect(
        fetchLinkedItems({
          windowId: "W1",
          entityName: "E1",
          recordId: "R1",
          adTabId: "T1",
          tableName: "T",
          columnName: "C",
        })
      ).rejects.toThrow("Error fetching linked items: Network Error");
    });
  });
});
