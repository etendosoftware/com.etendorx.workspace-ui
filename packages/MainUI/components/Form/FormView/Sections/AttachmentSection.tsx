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
import { Box, Grid, Typography, TextField, useTheme } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
import PlusIcon from "@workspaceui/componentlibrary/src/assets/icons/plus-circle.svg";
import DownloadIcon from "@workspaceui/componentlibrary/src/assets/icons/download.svg";
import EditIcon from "@workspaceui/componentlibrary/src/assets/icons/edit-3.svg";
import TrashIcon from "@workspaceui/componentlibrary/src/assets/icons/trash.svg";
import AttachmentIcon from "@workspaceui/componentlibrary/src/assets/icons/paperclip.svg";
import UploadIcon from "@workspaceui/componentlibrary/src/assets/icons/upload.svg";
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

interface AttachmentSectionProps {
  recordId: string;
  tabId: string;
  initialAttachmentCount: number;
  isSectionExpanded: boolean;
  onAttachmentsChange: () => void;
  showErrorModal?: (message: string) => void;
  openAddModal?: boolean;
  onAddModalClose?: () => void;
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
}: AttachmentSectionProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { session, user } = useUserContext();
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
  const hasLoadedAttachmentsRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  console.debug(attachments);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddAttachment = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      // Get organization ID from session or user context
      const orgId = session["#AD_Org_ID"] || session.adOrgId || user?.defaultOrganization;

      if (!orgId) {
        const errorMessage = t("forms.attachments.missingOrganization") || "Organization ID is required";
        if (showErrorModal) {
          showErrorModal(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      // Build params object
      const params: {
        recordId: string;
        tabId: string;
        file: File;
        description?: string;
        inpDocumentOrg: string;
      } = {
        recordId,
        tabId,
        file: selectedFile,
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

      // Close modal and reset file input
      setIsAddModalOpen(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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

  return (
    <Box data-testid="Box__attachments_section">
      {isLoading && isSectionExpanded && (
        <Typography data-testid="Typography__attachments_loading">{t("common.loading")}</Typography>
      )}
      {isSectionExpanded && (
        <Grid container spacing={1} data-testid="Grid__attachments_container" marginTop={1}>
          {/* Add Attachment Button */}
          <Grid item xs={4} md={2} data-testid="Grid__attachments_add">
            <IconButton
              data-testid="IconButton__attachments_add"
              className="p-2 space-x-1.5"
              onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon fill={theme.palette.baselineColor.neutral[80]} data-testid="PlusIcon__ce37c8" />
              <Typography variant="body1" data-testid="Typography__ce37c8">
                {t("forms.attachments.addAttachment")}
              </Typography>
            </IconButton>
          </Grid>

          {/* Download All Button */}
          {attachments.length > 0 && (
            <Grid item xs={4} md={2} data-testid="Grid__attachments_download_all">
              <IconButton
                data-testid="IconButton__attachments_download_all"
                className="p-2 space-x-1.5"
                onClick={() => setShowDownloadAllConfirmation(true)}>
                <DownloadIcon fill={theme.palette.baselineColor.neutral[80]} data-testid="DownloadIcon__ce37c8" />
                <Typography variant="body1" data-testid="Typography__ce37c8">
                  {t("forms.attachments.downloadAll")}
                </Typography>
              </IconButton>
            </Grid>
          )}

          {/* Remove All Button */}
          {attachments.length > 0 && (
            <Grid item xs={4} md={2} data-testid="Grid__attachments_remove_all">
              <IconButton
                data-testid="IconButton__attachments_remove_all"
                className="p-2 space-x-1.5"
                onClick={() => setShowDeleteAllConfirmation(true)}>
                <TrashIcon fill={theme.palette.error.main} data-testid="TrashIcon__ce37c8" />
                <Typography variant="body1" data-testid="Typography__ce37c8">
                  {t("forms.attachments.removeAll")}
                </Typography>
              </IconButton>
            </Grid>
          )}
        </Grid>
      )}
      {/* Add Attachment Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          if (onAddModalClose) {
            onAddModalClose();
          }
        }}
        onCancel={() => {
          setIsAddModalOpen(false);
          if (onAddModalClose) {
            onAddModalClose();
          }
        }}
        HeaderIcon={AttachmentIcon}
        tittleHeader={t("forms.attachments.addAttachmentModalTitle")}
        descriptionText={t("forms.attachments.addAttachmentModalDescription")}
        data-testid="Modal__attachments_add">
        <div className="space-y-4">
          {/* Custom File Input Button */}
          <div className="flex flex-col gap-2">
            <span className="block text-sm font-medium text-gray-700">{t("forms.attachments.chooseFile")}</span>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="attachment-file-input"
                data-testid="Input__attachments_file"
              />
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                data-testid="IconButton__choose_file">
                <AttachmentIcon width={20} height={20} data-testid="AttachmentIcon__ce37c8" />
                <Typography variant="body1" className="ml-2" data-testid="Typography__ce37c8">
                  {selectedFile ? t("forms.attachments.changeFile") : t("forms.attachments.selectFile")}
                </Typography>
              </IconButton>
              {selectedFile && (
                <div className="text-sm text-gray-600 text-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Typography
                    variant="body2"
                    className="truncate"
                    title={selectedFile.name}
                    data-testid="Typography__ce37c8">
                    {selectedFile.name}
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {/* Description Field */}
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder={t("forms.attachments.descriptionPlaceholder")}
            label={t("forms.attachments.description")}
            data-testid="TextField__attachments_description"
          />

          {/* Upload Button */}
          <IconButton
            onClick={handleAddAttachment}
            disabled={!selectedFile || isLoading}
            className="w-full justify-center border border-gray-300 hover:border-transparent mt-4 p-2 gap-2"
            data-testid="IconButton__attachments_submit">
            <UploadIcon width={16} height={16} data-testid="UploadIcon__ce37c8" />
            <Typography variant="body1" className="ml-2" data-testid="Typography__ce37c8">
              {t("forms.attachments.uploadButton")}
            </Typography>
          </IconButton>
        </div>
      </Modal>
      {/* Attachment Tags */}
      {isSectionExpanded && attachments.length > 0 && (
        <div className="my-4 flex flex-wrap gap-2" data-testid="Box__attachments_tags">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
              data-testid={`Box__attachment_tag_${attachment.id}`}>
              <button
                type="button"
                onClick={() => {
                  setPreviewAttachment(attachment);
                }}
                className="border-none bg-transparent cursor-pointer p-0 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                data-testid={`Button__attachment_name_${attachment.id}`}>
                {attachment.name}
              </button>
              <div className="flex items-center gap-0.5 ml-1">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAttachment(attachment.id, attachment.name);
                  }}
                  disabled={isLoading}
                  className="hover:bg-gray-200 rounded-full p-1"
                  data-testid={`IconButton__download_${attachment.id}`}>
                  <DownloadIcon width={16} height={16} data-testid="DownloadIcon__ce37c8" />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirmation(attachment.id);
                  }}
                  disabled={isLoading}
                  className="hover:bg-red-50 rounded-full p-1"
                  data-testid={`IconButton__delete_${attachment.id}`}>
                  <TrashIcon width={16} height={16} fill="#EF4444" data-testid="TrashIcon__ce37c8" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Preview Attachment Modal */}
      {previewAttachment && (
        <Modal
          open={!!previewAttachment}
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
          <div className="flex flex-col gap-4">
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{t("forms.attachments.createdBy")}:</span>
                <span>{previewAttachment.createdBy$_identifier}</span>
              </div>
              <div className="text-gray-400">•</div>
              <div>{new Date(previewAttachment.creationDate).toLocaleDateString()}</div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
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
                    <EditIcon width={16} height={16} data-testid="EditIcon__ce37c8" />
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
                      <CheckIcon width={20} height={20} data-testid="CheckIcon__ce37c8" />
                      <Typography variant="body1" data-testid="Typography__ce37c8">
                        {t("common.save")}
                      </Typography>
                    </IconButton>
                    <IconButton
                      onClick={() => setIsEditingInPreview(false)}
                      className="flex-1 justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                      data-testid="IconButton__preview_cancel">
                      <XIcon width={20} height={20} data-testid="XIcon__ce37c8" />
                      <Typography variant="body1" className="ml-2" data-testid="Typography__ce37c8">
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

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <IconButton
                onClick={() => handleDownloadAttachment(previewAttachment.id, previewAttachment.name)}
                disabled={isLoading}
                className="flex-1 justify-center border border-gray-300 hover:border-transparent p-2 gap-2"
                data-testid="IconButton__preview_download">
                <DownloadIcon width={20} height={20} data-testid="DownloadIcon__ce37c8" />
                <Typography variant="body1" className="ml-2" data-testid="Typography__ce37c8">
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
                <TrashIcon width={20} height={20} data-testid="TrashIcon__ce37c8" />
                <Typography variant="body1" className="ml-2" data-testid="Typography__ce37c8">
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
