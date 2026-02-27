import React from "react";

export const ToastContent = ({ message, isHtml }: { message: string; isHtml?: boolean }) => {
  if (!message) return null;

  // Auto-detect HTML if not explicitly provided
  const hasHtmlTags = isHtml || /<[a-z][\s\S]*>/i.test(message);

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
