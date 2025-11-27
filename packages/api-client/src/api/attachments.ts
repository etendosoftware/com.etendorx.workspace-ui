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

import { Metadata } from "./metadata";
import type {
  Attachment,
  FetchAttachmentsParams,
  CreateAttachmentParams,
  EditAttachmentParams,
  DeleteAttachmentParams,
  DownloadAttachmentParams,
  DownloadAllAttachmentsParams,
} from "./types";

// Use custom AttachmentServlet registered in SWS
// The route proxy will convert 'attachments' to 'sws/com.etendoerp.metadata.attachments'
const ATTACHMENT_SERVLET_ENDPOINT = "attachments";

/**
 * Fetches the list of attachments for a given record
 * Uses custom AttachmentServlet with LIST command
 */
export async function fetchAttachments(params: FetchAttachmentsParams): Promise<Attachment[]> {
  const client = Metadata.client;

  try {
    const url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=LIST&tabId=${params.tabId}&recordId=${params.recordId}`;

    const response = await client.request(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to fetch attachments: ${response.status}`);
    }

    const data = response.data as { attachments?: Attachment[] };
    const attachments = data.attachments || [];

    // Clean up description format (remove "Description: " prefix from Etendo Classic format)
    return attachments.map((att) => ({
      ...att,
      description: att.description?.startsWith("Description: ")
        ? att.description.substring("Description: ".length)
        : att.description,
    }));
  } catch (error) {
    throw new Error(`Error fetching attachments: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new attachment by uploading a file
 * Uses custom AttachmentServlet with UPLOAD command
 */
export async function createAttachment(params: CreateAttachmentParams): Promise<Attachment> {
  const client = Metadata.client;

  try {
    const formData = new FormData();
    formData.append("file", params.file);

    // Build URL with query parameters
    let url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=UPLOAD&tabId=${params.tabId}&recordId=${params.recordId}&orgId=${params.inpDocumentOrg}`;

    // Note: Do NOT add "Description: " prefix here - the backend metadata system adds it automatically
    if (params.description) {
      url += `&description=${encodeURIComponent(params.description)}`;
    }

    const response = await client.post(url, formData);

    if (!response.ok) {
      const errorData = response.data as { error?: string };
      throw new Error(errorData?.error || `Failed to create attachment: ${response.status}`);
    }

    // After successful upload, fetch the updated list to return the new attachment
    const attachments = await fetchAttachments({ tabId: params.tabId, recordId: params.recordId });

    // Return the most recently created attachment (first in list after sorting by sequence)
    return attachments[attachments.length - 1] || ({} as Attachment);
  } catch (error) {
    throw new Error(`Error creating attachment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Edits an attachment's description
 * Uses custom AttachmentServlet with EDIT command
 */
export async function editAttachment(params: EditAttachmentParams): Promise<void> {
  const client = Metadata.client;

  try {
    const url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=EDIT&tabId=${params.tabId}&attachmentId=${params.attachmentId}`;

    // Send description in request body as JSON
    // Note: Do NOT add "Description: " prefix here - the backend metadata system adds it automatically
    const body: { description?: string } = {};
    if (params.description !== undefined) {
      body.description = params.description;
    }

    const response = await client.post(url, body);

    if (!response.ok) {
      const errorData = response.data as { error?: string };
      throw new Error(errorData?.error || `Failed to edit attachment: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error editing attachment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes an attachment
 * Uses custom AttachmentServlet with DELETE command
 */
export async function deleteAttachment(params: DeleteAttachmentParams): Promise<void> {
  const client = Metadata.client;

  try {
    const url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=DELETE&attachmentId=${params.attachmentId}`;

    const response = await client.post(url, {});

    if (!response.ok) {
      const errorData = response.data as { error?: string };
      throw new Error(errorData?.error || `Failed to delete attachment: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error deleting attachment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Downloads a single attachment file
 * Uses custom AttachmentServlet with DOWNLOAD command
 */
export async function downloadAttachment(params: DownloadAttachmentParams): Promise<Blob> {
  const client = Metadata.client;

  try {
    const url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=DOWNLOAD&attachmentId=${params.attachmentId}`;

    const response = await client.request(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status}`);
    }

    // Response should be a Blob
    return response.data as Blob;
  } catch (error) {
    throw new Error(`Error downloading attachment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Downloads all attachments for a record as a ZIP file
 */
export async function downloadAllAttachments(params: DownloadAllAttachmentsParams): Promise<Blob> {
  const client = Metadata.client;

  try {
    const url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=DOWNLOAD_ALL&tabId=${params.tabId}&recordId=${params.recordId}`;

    const response = await client.request(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to download all attachments: ${response.status}`);
    }

    // Response should be a Blob (ZIP file)
    return response.data as Blob;
  } catch (error) {
    throw new Error(`Error downloading all attachments: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes all attachments for a record
 */
export async function deleteAllAttachments(params: { recordId: string; tabId: string }): Promise<void> {
  const client = Metadata.client;

  try {
    const url = `${ATTACHMENT_SERVLET_ENDPOINT}?command=DELETE_ALL&tabId=${params.tabId}&recordId=${params.recordId}`;

    const response = await client.post(url, {});

    if (!response.ok) {
      const errorData = response.data as { error?: string };
      throw new Error(errorData?.error || `Failed to delete all attachments: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error deleting all attachments: ${error instanceof Error ? error.message : String(error)}`);
  }
}
