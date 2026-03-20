import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import UploadIcon from "@workspaceui/componentlibrary/src/assets/icons/upload.svg";
import FileTextIcon from "@workspaceui/componentlibrary/src/assets/icons/file-text.svg";
import XIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";

interface UploadFileSelectorProps {
  field: Field;
  disabled?: boolean;
  onFileChange?: (paramName: string, file: File | null) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const UploadFileSelector = ({ field, disabled, onFileChange }: UploadFileSelectorProps) => {
  const { setValue } = useFormContext();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValue(field.hqlName, `C:\\fakepath\\${file.name}`);
    // Use columnName (dBColumnName) as key for fileParams — the backend expects this as the FormData field name
    onFileChange?.(field.columnName, file);

    // Reset input to allow selecting same file again
    event.target.value = "";
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setValue(field.hqlName, "");
    onFileChange?.(field.columnName, null);
  };

  return (
    <div className="flex items-center h-full w-full" data-testid="UploadFileSelector__container">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        data-testid="UploadFileSelector__input"
      />

      {selectedFile ? (
        <div className="flex items-center gap-2 w-full h-10.5 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
          <FileTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" data-testid="UploadFileSelector__file_icon" />
          <span className="text-sm text-gray-700 truncate flex-1" data-testid="UploadFileSelector__filename">
            {selectedFile.name}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0" data-testid="UploadFileSelector__filesize">
            {formatFileSize(selectedFile.size)}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer border-none bg-transparent"
              data-testid="UploadFileSelector__remove">
              <XIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-2 w-full h-10.5 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="UploadFileSelector__select_button">
          <UploadIcon className="h-4 w-4 text-gray-400" data-testid="UploadFileSelector__upload_icon" />
          <span className="text-sm text-gray-500">{t("process.selectFile")}</span>
        </button>
      )}
    </div>
  );
};

export default UploadFileSelector;
