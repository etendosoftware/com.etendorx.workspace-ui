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

import { API_LOGIN_URL } from "./constants";
import { Metadata } from "./metadata";
import type { LoginResponse } from "./types";

interface ChangeProfilePayload {
  role?: string;
  warehouse?: string;
}

/**
 * Function to handle the profile change, including role and warehouse updates.
 *
 * @param params - The profile change parameters, which may include a role and/or warehouse.
 * @returns A promise that resolves to a LoginResponse object if successful.
 */
export const changeProfile = async (params: ChangeProfilePayload): Promise<LoginResponse> => {
  try {
    const response = await Metadata.loginClient.request(API_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: LoginResponse = response.data;

    if (!data.token) {
      throw new Error("Invalid server response");
    }

    return data;
  } catch (error) {
    console.error("Profile change error:", error);
    throw error;
  }
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const { role, warehouse } = req.body;
    const data = await changeProfile({ role, warehouse });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in changeProfile API:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
