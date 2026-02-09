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

import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, useTheme } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
import DownloadIcon from "@workspaceui/componentlibrary/src/assets/icons/download.svg";
import EditIcon from "@workspaceui/componentlibrary/src/assets/icons/edit-3.svg";
import TrashIcon from "@workspaceui/componentlibrary/src/assets/icons/trash.svg";
import AttachmentIcon from "@workspaceui/componentlibrary/src/assets/icons/paperclip.svg";
import UploadIcon from "@workspaceui/componentlibrary/src/assets/icons/upload.svg";
import FilePlusIcon from "@workspaceui/componentlibrary/src/assets/icons/file-plus.svg";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check.svg";
import XIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import type { Attachment } from "@workspaceui/api-client/src/api/types";
import {
  fetchAttachments,
  createAttachment,
  editAttachment,
  deleteAttachment,
  deleteAllAttachments,
  downloadAttachment,
  downloadAllAttachments,
} from "@workspaceui/api-client/src/api/attachments";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import { AddAttachmentModal } from "./AddAttachmentModal";

const TYPOGRAPHY_TEST_ID = "Typography__ce37c8";
const TRASH_ICON_TEST_ID = "TrashIcon__ce37c8";
const DOWNLOAD_ICON_TEST_ID = "DownloadIcon__ce37c8";
const UPLOAD_ICON_TEST_ID = "UploadIcon__ce37c8";
const FILE_PLUS_ICON_TEST_ID = "FilePlusIcon__ce37c8";
const CHECK_ICON_TEST_ID = "CheckIcon__ce37c8";
const EDIT_ICON_TEST_ID = "EditIcon__ce37c8";
const X_ICON_TEST_ID = "XIcon__ce37c8";
const ATTACHMENT_ICON_TEST_ID = "AttachmentIcon__ce37c8";

interface AttachmentSectionProps {
  recordId: string;
  tabId: string;
  initialAttachmentCount: number;
  isSectionExpanded: boolean;
  onAttachmentsChange: () => void;
  showErrorModal?: (message: string) => void;
  openAddModal?: boolean;
  onAddModalClose?: () => void;
  recordIdentifier?: string;
}

const AttachmentSection = ({
  recordId,
  tabId,
  initialAttachmentCount,
  isSectionExpanded,
  onAttachmentsChange,
  showErrorModal,
  openAddModal = false,
  onAddModalClose,
  recordIdentifier,
}: AttachmentSectionProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { session, currentOrganization } = useUserContext();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [showDownloadAllConfirmation, setShowDownloadAllConfirmation] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [isEditingInPreview, setIsEditingInPreview] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hasLoadedAttachmentsRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Loop State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Sync external openAddModal prop with internal state
  useEffect(() => {
    if (openAddModal) {
      setIsAddModalOpen(true);
    }
  }, [openAddModal]);

  useEffect(() => {
    hasLoadedAttachmentsRef.current = false;
    setAttachments([]);
  }, [recordId]);

  useEffect(() => {
    if (isSectionExpanded && !hasLoadedAttachmentsRef.current && initialAttachmentCount > 0) {
      hasLoadedAttachmentsRef.current = true;
      const loadAttachments = async () => {
        setIsLoading(true);
        try {
          const fetchedAttachments = await fetchAttachments({ recordId, tabId });
          setAttachments(fetchedAttachments);
        } catch (error) {
          console.error("Failed to fetch attachments:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : t("forms.attachments.errorLoadingAttachments") || "Failed to load attachments";
          if (showErrorModal) {
            showErrorModal(errorMessage);
          }
        } finally {
          setIsLoading(false);
        }
      };
      loadAttachments();
    }
  }, [isSectionExpanded, recordId, tabId, initialAttachmentCount, t, showErrorModal]);

  // Preview Fetch Effect
  useEffect(() => {
    if (!previewAttachment) {
      setPreviewUrl(null);
      return;
    }

    const loadPreview = async () => {
      const fileName = previewAttachment.name.toLowerCase();
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/.test(fileName);
      const isPdf = /\.pdf$/.test(fileName);

      if (!isImage && !isPdf) {
        setPreviewUrl(null);
        return;
      }

      setIsPreviewLoading(true);
      try {
        const blob = await downloadAttachment({
          attachmentId: previewAttachment.id,
          tabId,
          recordId,
        });

        // Ensure proper MIME type for PDF files to allow browser preview
        let finalBlob = blob;
        if (isPdf) {
          finalBlob = new Blob([blob], { type: "application/pdf" });
        }

        const url = window.URL.createObjectURL(finalBlob);
        setPreviewUrl(url);
      } catch (error) {
        console.error("Failed to load preview:", error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    loadPreview();

    // Cleanup function
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewAttachment, tabId, recordId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsAddModalOpen(true);
    }
    // Reset inputs value to allow selecting same file again
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setIsAddModalOpen(true);
    }
  };

  const handleAddAttachment = async (fileOverride?: File) => {
    const fileToUpload = fileOverride || selectedFile;
    if (!fileToUpload) return;

    setIsLoading(true);
    try {
      const orgId = session["#AD_Org_ID"] || session.adOrgId || currentOrganization?.id;

      if (!orgId) {
        throw new Error("Organization ID not found in session or user context");
      }

      const params: {
        recordId: string;
        tabId: string;
        file: File;
        description?: string;
        inpDocumentOrg: string;
      } = {
        recordId,
        tabId,
        file: fileToUpload,
        inpDocumentOrg: orgId as string,
      };

      if (newDescription) {
        params.description = newDescription;
      }

      const createdAttachment = await createAttachment(params);

      setAttachments((prev) => [createdAttachment, ...prev]);
      setSelectedFile(null);
      setNewDescription("");
      onAttachmentsChange();

      setIsAddModalOpen(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    } catch (error) {
      console.error("Failed to add attachment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("forms.attachments.errorAddingAttachment") || "Failed to add attachment";
      if (showErrorModal) {
        showErrorModal(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!showDeleteConfirmation) return;

    setIsLoading(true);
    try {
      await deleteAttachment({
        attachmentId: showDeleteConfirmation,
        tabId,
        recordId,
      });

      setAttachments((prev) => prev.filter((att) => att.id !== showDeleteConfirmation));
      onAttachmentsChange();
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("forms.attachments.errorDeletingAttachment") || "Failed to delete attachment";
      if (showErrorModal) {
        showErrorModal(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setShowDeleteConfirmation(null);
    }
  };

  const handleDeleteAllAttachments = async () => {
    setIsLoading(true);
    try {
      await deleteAllAttachments({
        tabId,
        recordId,
      });

      setAttachments([]);
      onAttachmentsChange();
    } catch (error) {
      console.error("Failed to delete all attachments:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("forms.attachments.errorDeletingAllAttachments") || "Failed to delete all attachments";
      if (showErrorModal) {
        showErrorModal(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setShowDeleteAllConfirmation(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const blob = await downloadAttachment({ attachmentId, tabId, recordId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download attachment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("forms.attachments.errorDownloadingAttachment") || "Failed to download attachment";
      if (showErrorModal) {
        showErrorModal(errorMessage);
      }
    }
  };

  const handleDownloadAllAttachments = async () => {
    try {
      const blob = await downloadAllAttachments({ tabId, recordId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "attachments.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download all attachments:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("forms.attachments.errorDownloadingAllAttachments") || "Failed to download all attachments";
      if (showErrorModal) {
        showErrorModal(errorMessage);
      }
    } finally {
      setShowDownloadAllConfirmation(false);
    }
  };

  const isImagePreview =
    previewUrl && previewAttachment && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewAttachment.name);

  return (
    <Box data-testid="Box__attachments_section">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        id="attachment-file-input"
        data-testid="Input__attachments_file"
      />
      {isLoading && isSectionExpanded && (
        <Typography data-testid="Typography__attachments_loading">{t("common.loading")}</Typography>
      )}
      {isSectionExpanded && (
        <div className="flex flex-col gap-4 mt-2" data-testid="Div__attachments_container">
          {/* Attachments and Actions Row */}
          {attachments.length > 0 && (
            <div
              className="flex items-center gap-2 overflow-x-auto pb-2 px-1"
              data-testid="Div__attachments_scrollable_container">
              {/* Attachment Tags */}
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm min-w-fit"
                  data-testid={`Box__attachment_tag_${attachment.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewAttachment(attachment);
                    }}
                    className="border-none bg-transparent cursor-pointer p-0 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 whitespace-nowrap"
                    data-testid={`Button__attachment_name_${attachment.id}`}>
                    {/* Add a generic file icon here if desired */}
                    {attachment.name}
                  </button>
                  <div className="flex items-center gap-0.5 ml-1 border-l pl-1 border-gray-300">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirmation(attachment.id);
                      }}
                      disabled={isLoading}
                      className="p-1 h-6 w-6 m-0"
                      data-testid={`IconButton__delete_${attachment.id}`}>
                      <TrashIcon width={14} height={14} data-testid={TRASH_ICON_TEST_ID} />
                    </IconButton>
                  </div>
                </div>
              ))}

              {/* Action Buttons styled as chips */}
              <button
                type="button"
                onClick={() => setShowDownloadAllConfirmation(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer min-w-fit whitespace-nowrap"
                data-testid="Button__attachments_download_all_chip">
                <DownloadIcon
                  width={14}
                  height={14}
                  fill={theme.palette.text.secondary}
                  data-testid={DOWNLOAD_ICON_TEST_ID}
                />
                <span className="text-sm font-medium text-gray-700">{t("forms.attachments.downloadAll")}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteAllConfirmation(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-white border border-red-200 hover:bg-red-50 transition-colors shadow-sm cursor-pointer min-w-fit whitespace-nowrap"
                data-testid="Button__attachments_remove_all_chip">
                <TrashIcon width={14} height={14} fill={theme.palette.error.main} data-testid={TRASH_ICON_TEST_ID} />
                <span className="text-sm font-medium text-red-700">{t("forms.attachments.removeAll")}</span>
              </button>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              borderColor: isDragging ? theme.palette.dynamicColor.main : "#93C5FD",
              backgroundColor: isDragging ? `${theme.palette.dynamicColor.main}15` : "#F0F5FF",
            }}
            className="relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[160px]"
            data-testid="Div__attachments_dropzone">
            {/* Upload Icon top right */}
            <div className="absolute top-4 right-4 text-gray-400">
              <UploadIcon width={20} height={20} fill="currentColor" data-testid={UPLOAD_ICON_TEST_ID} />
            </div>

            {/* Center Content */}
            <div className="flex flex-col items-center gap-3 mt-6">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <FilePlusIcon width={32} height={32} fill="#6B7280" data-testid={FILE_PLUS_ICON_TEST_ID} />
              </div>
              <div className="text-center">
                <Typography variant="body1" className="font-medium text-gray-700" data-testid={TYPOGRAPHY_TEST_ID}>
                  {t("forms.attachments.dropZoneText")}
                </Typography>
                <Typography variant="caption" className="text-blue-500 mt-1 block" data-testid={TYPOGRAPHY_TEST_ID}>
                  {t("forms.attachments.maxSizeText")}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Attachment Modal */}
      <AddAttachmentModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedFile(null);
          setNewDescription("");
          if (onAddModalClose) {
            onAddModalClose();
          }
        }}
        onUpload={async (file: File, description: string) => {
          setNewDescription(description);
          setSelectedFile(file);
          await handleAddAttachment(file);
        }}
        initialFile={selectedFile}
        isLoading={isLoading}
        recordIdentifier={recordIdentifier}
        data-testid="AddAttachmentModal__ce37c8"
      />
      {/* Preview Attachment Modal */}
      {previewAttachment && (
        <Modal
          open={!!previewAttachment}
          width={500}
          onClose={() => {
            setPreviewAttachment(null);
            setIsEditingInPreview(false);
          }}
          onCancel={() => {
            setPreviewAttachment(null);
            setIsEditingInPreview(false);
          }}
          HeaderIcon={AttachmentIcon}
          tittleHeader={previewAttachment.name}
          descriptionText={t("forms.attachments.previewModalDescription")}
          data-testid="Modal__attachments_preview">
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{t("forms.attachments.createdBy")}:</span>
                <span>{previewAttachment.createdBy$_identifier}</span>
              </div>
              <div className="text-gray-400">•</div>
              <div>{new Date(previewAttachment.creationDate).toLocaleDateString()}</div>
            </div>

            <div className="space-y-3 ">
              {/* Preview Content */}
              <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden h-[350px] items-center border border-gray-200">
                {isPreviewLoading && (
                  <Typography className="text-gray-500" data-testid={TYPOGRAPHY_TEST_ID}>
                    {t("common.loading")}
                  </Typography>
                )}

                {!isPreviewLoading && previewUrl && isImagePreview && (
                  <img src={previewUrl} alt={previewAttachment.name} className="max-h-full max-w-full object-contain" />
                )}

                {!isPreviewLoading && previewUrl && !isImagePreview && (
                  <embed src={previewUrl} type="application/pdf" className="w-full h-full border-none" />
                )}

                {!isPreviewLoading && !previewUrl && (
                  <div className="flex flex-col items-center p-8 text-gray-400">
                    <AttachmentIcon width={48} height={48} fill="currentColor" data-testid={ATTACHMENT_ICON_TEST_ID} />
                    <Typography className="mt-2" data-testid={TYPOGRAPHY_TEST_ID}>
                      Preview not available
                    </Typography>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">{t("forms.attachments.description")}</h3>
                {!isEditingInPreview && (
                  <IconButton
                    onClick={() => {
                      setEditDescription(previewAttachment.description || "");
                      setIsEditingInPreview(true);
                    }}
                    className="hover:bg-dynamic-main rounded-xl p-2"
                    data-testid="IconButton__preview_edit">
                    <EditIcon width={16} height={16} data-testid={EDIT_ICON_TEST_ID} />
                  </IconButton>
                )}
              </div>

              {isEditingInPreview ? (
                <div className="space-y-3">
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t("forms.attachments.descriptionPlaceholder")}
                    data-testid="TextField__preview_edit_description"
                  />
                  <div className="flex gap-2 mt-2">
                    <IconButton
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          await editAttachment({
                            attachmentId: previewAttachment.id,
                            tabId,
                            recordId,
                            description: editDescription,
                          });

                          setAttachments((prev) =>
                            prev.map((att) =>
                              att.id === previewAttachment.id ? { ...att, description: editDescription } : att
                            )
                          );
                          setPreviewAttachment({
                            ...previewAttachment,
                            description: editDescription,
                          });
                          setIsEditingInPreview(false);
                          setEditDescription("");
                        } catch (error) {
                          console.error("Failed to edit attachment:", error);
                          const errorMessage =
                            error instanceof Error
                              ? error.message
                              : t("forms.attachments.errorEditingAttachment") || "Failed to edit attachment";
                          if (showErrorModal) {
                            showErrorModal(errorMessage);
                          }
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1 justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                      data-testid="IconButton__preview_save">
                      <CheckIcon width={20} height={20} data-testid={CHECK_ICON_TEST_ID} />
                      <Typography variant="body1" data-testid={TYPOGRAPHY_TEST_ID}>
                        {t("common.save")}
                      </Typography>
                    </IconButton>
                    <IconButton
                      onClick={() => setIsEditingInPreview(false)}
                      className="flex-1 justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                      data-testid="IconButton__preview_cancel">
                      <XIcon width={20} height={20} data-testid={X_ICON_TEST_ID} />
                      <Typography variant="body1" className="ml-2" data-testid={TYPOGRAPHY_TEST_ID}>
                        {t("common.cancel")}
                      </Typography>
                    </IconButton>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-5 border border-gray-200 min-h-[60px]">
                  {previewAttachment.description || t("forms.attachments.noDescription")}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <IconButton
                onClick={() => handleDownloadAttachment(previewAttachment.id, previewAttachment.name)}
                disabled={isLoading}
                className="flex-1 justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                data-testid="IconButton__preview_download">
                <DownloadIcon width={20} height={20} data-testid={DOWNLOAD_ICON_TEST_ID} />
                <Typography variant="body1" className="ml-2" data-testid={TYPOGRAPHY_TEST_ID}>
                  {t("common.download")}
                </Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  setShowDeleteConfirmation(previewAttachment.id);
                  setPreviewAttachment(null);
                }}
                disabled={isLoading}
                className="flex-1 justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                data-testid="IconButton__preview_delete">
                <TrashIcon width={20} height={20} data-testid={TRASH_ICON_TEST_ID} />
                <Typography variant="body1" className="ml-2" data-testid={TYPOGRAPHY_TEST_ID}>
                  {t("common.delete")}
                </Typography>
              </IconButton>
            </div>
          </div>
        </Modal>
      )}
      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!showDeleteConfirmation}
        confirmText={t("forms.notes.confirmDelete")}
        onConfirm={handleDeleteAttachment}
        onCancel={() => setShowDeleteConfirmation(null)}
        saveLabel={t("forms.notes.deleteButton")}
        secondaryButtonLabel={t("common.cancel")}
        data-testid="ConfirmModal__attachments_delete"
      />
      {/* Delete All Confirmation */}
      <ConfirmModal
        open={showDeleteAllConfirmation}
        confirmText={t("forms.attachments.confirmDeleteAllMessage")}
        onConfirm={handleDeleteAllAttachments}
        onCancel={() => setShowDeleteAllConfirmation(false)}
        saveLabel={t("common.delete")}
        secondaryButtonLabel={t("common.cancel")}
        data-testid="ConfirmModal__attachments_delete_all"
      />
      {/* Download All Confirmation */}
      <ConfirmModal
        open={showDownloadAllConfirmation}
        confirmText={t("forms.attachments.confirmDownloadAllMessage")}
        onConfirm={handleDownloadAllAttachments}
        onCancel={() => setShowDownloadAllConfirmation(false)}
        saveLabel={t("common.download")}
        secondaryButtonLabel={t("common.cancel")}
        data-testid="ConfirmModal__attachments_download_all"
      />
    </Box>
  );
};

export default AttachmentSection;
