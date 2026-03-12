import type React from "react";

function parseHtmlToReact(html: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match complete <a> tags, <br> tags, or any other tag (stripped)
  const regex = /<a\b[^>]*>[\s\S]*?<\/a>|<br\s*\/?>|<[^>]*>/gi;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec loop pattern
  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(html.slice(lastIndex, match.index));
    }

    const tag = match[0];
    if (/^<br/i.test(tag)) {
      nodes.push(<br key={key++} />);
    } else if (/^<a\b/i.test(tag)) {
      const hrefMatch = /href=["']([^"']*)["']/i.exec(tag);
      const innerText = tag.replace(/<[^>]*>/g, "");
      nodes.push(
        <a
          key={key++}
          href={hrefMatch?.[1] ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800">
          {innerText}
        </a>
      );
    }
    // Other tags are stripped

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < html.length) {
    nodes.push(html.slice(lastIndex));
  }

  return nodes;
}

export const ToastContent = ({
  message,
  isHtml,
  action,
}: {
  message: string;
  isHtml?: boolean;
  action?: { label: string; onClick: () => void };
}) => {
  if (!message) return null;

  const hasHtmlTags = isHtml || /<[a-z][\s\S]*>/i.test(message);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm md:text-base font-medium whitespace-pre-wrap break-words">
        {hasHtmlTags ? parseHtmlToReact(message) : message.replace(/<br\s*\/?>/gi, "\n")}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-blue-600 underline hover:text-blue-800 font-medium text-sm text-left w-fit">
          {action.label}
        </button>
      )}
    </div>
  );
};
