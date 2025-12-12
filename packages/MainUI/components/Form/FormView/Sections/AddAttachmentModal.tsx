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

import { useState, useRef, useEffect } from "react";
import { Typography, TextField } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import AttachmentIcon from "@workspaceui/componentlibrary/src/assets/icons/paperclip.svg";
import UploadIcon from "@workspaceui/componentlibrary/src/assets/icons/upload.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { useTranslation } from "@/hooks/useTranslation";

interface AddAttachmentModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, description: string) => Promise<void>;
  initialFile?: File | null;
  isLoading?: boolean;
  recordIdentifier?: string;
}

export const AddAttachmentModal = ({
  open,
  onClose,
  onUpload,
  initialFile = null,
  isLoading = false,
  recordIdentifier,
}: AddAttachmentModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setSelectedFile(initialFile);
  }, [initialFile, open]);

  // Handle preview URL creation and cleanup
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setDescription("");
      setSelectedFile(null);
    }
  }, [open]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset inputs value to allow selecting same file again
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile, description);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      HeaderIcon={AttachmentIcon}
      tittleHeader={t("forms.attachments.addAttachmentModalTitle")}
      descriptionText={t("forms.attachments.addAttachmentModalDescription")}
      data-testid="Modal__attachments_add">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        id="modal-attachment-file-input"
        data-testid="Input__modal_attachments_file"
      />
      <div className="space-y-4">
        {/* Record Identifier Section */}
        {recordIdentifier && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Typography variant="caption" className="text-gray-600 block mb-1" data-testid="Typography__746543">
              Uploading to record:
            </Typography>
            <Typography variant="body2" className="font-medium text-gray-900" data-testid="Typography__746543">
              {recordIdentifier}
            </Typography>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="block text-sm font-medium text-gray-700">{t("forms.attachments.selectedFile")}</span>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Preview Section */}
            {previewUrl && (
              <div className="mb-3 flex justify-center bg-white rounded border border-gray-100 overflow-hidden max-h-[200px]">
                {selectedFile?.type.startsWith("image/") ? (
                  <img src={previewUrl} alt="Preview" className="max-h-[200px] max-w-full object-contain" />
                ) : selectedFile?.type === "application/pdf" ? (
                  <div className="w-full flex items-center justify-center h-[100px] bg-gray-100 text-gray-400">
                    <Typography variant="caption" data-testid="Typography__746543">
                      PDF Preview
                    </Typography>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded border border-gray-200">
                <AttachmentIcon width={24} height={24} fill="#6B7280" data-testid="AttachmentIcon__modal" />
              </div>
              <div className="flex-1 min-w-0">
                <Typography
                  variant="body2"
                  className="font-medium text-gray-900 truncate"
                  title={selectedFile?.name}
                  data-testid="Typography__modal_filename">
                  {selectedFile?.name || t("forms.attachments.noFileSelected")}
                </Typography>
                <Typography variant="caption" className="text-gray-500" data-testid="Typography__modal_filesize">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}
                </Typography>
              </div>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:bg-blue-50 p-2 text-sm font-medium"
                data-testid="IconButton__change_file">
                {t("common.change")}
              </IconButton>
            </div>
          </div>
        </div>

        <TextField
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("forms.attachments.descriptionPlaceholder")}
          label={t("forms.attachments.description")}
          data-testid="TextField__attachments_description"
        />

        <IconButton
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className={`w-full justify-center border border-gray-300 mt-4 p-2 gap-2 rounded-md transition-opacity ${
            !selectedFile || isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:opacity-90 text-white"
          }`}
          data-testid="IconButton__attachments_submit">
          <UploadIcon
            width={16}
            height={16}
            fill={!selectedFile || isLoading ? "#6B7280" : "white"}
            data-testid="UploadIcon__modal_submit"
          />
          <Typography
            variant="body1"
            className={`ml-2 ${!selectedFile || isLoading ? "text-gray-500" : "text-white"}`}
            data-testid="Typography__modal_submit_text">
            {t("forms.attachments.uploadButton")}
          </Typography>
        </IconButton>
      </div>
    </Modal>
  );
};
