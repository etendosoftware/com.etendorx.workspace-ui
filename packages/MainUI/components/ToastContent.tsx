import React from "react";

export const ToastContent = ({
  message,
  isHtml,
  linkTabId,
  linkRecordId,
  onNavigate,
}: {
  message: string;
  isHtml?: boolean;
  linkTabId?: string;
  linkRecordId?: string;
  onNavigate?: (tabId: string, recordId: string) => void;
}) => {
  if (!message) return null;

  // Auto-detect HTML if not explicitly provided
  const hasHtmlTags = isHtml || /<[a-z][\s\S]*>/i.test(message);

  const renderMessage = () => {
    if (hasHtmlTags) {
      return (
        <div
          className="text-sm md:text-base font-medium whitespace-pre-line break-words"
          dangerouslySetInnerHTML={{ __html: message.replace(/<br\s*\/?>/gi, "<br/>") }}
        />
      );
    }

    return (
      <div className="text-sm md:text-base font-medium whitespace-pre-wrap break-words">
        {message.replace(/<br\s*\/?>/gi, "\n")}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {renderMessage()}
      {linkTabId && linkRecordId && onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate(linkTabId, linkRecordId)}
          className="text-sm font-bold underline hover:opacity-80 transition-opacity self-start">
          View Details
        </button>
      )}
    </div>
  );
};
