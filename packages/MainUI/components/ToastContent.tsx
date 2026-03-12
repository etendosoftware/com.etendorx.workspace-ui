import type React from "react";

function parseHtmlToReact(html: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match any tag: <...>. This is linear and safe against ReDoS.
  const tagRegex = /<[^>]*>/gi;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  let currentAnchor: { href: string; content: string } | null = null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec loop pattern
  while ((match = tagRegex.exec(html)) !== null) {
    const textBefore = html.slice(lastIndex, match.index);
    const tag = match[0];

    // Append text since the last tag to the appropriate node
    if (currentAnchor) {
      currentAnchor.content += textBefore;
    } else if (textBefore) {
      nodes.push(textBefore);
    }

    if (/^<br/i.test(tag)) {
      if (currentAnchor) {
        currentAnchor.content += "\n";
      } else {
        nodes.push(<br key={key++} />);
      }
    } else if (/^<a\b/i.test(tag)) {
      if (!currentAnchor) {
        const hrefMatch = /href=["']([^"']*)["']/i.exec(tag);
        currentAnchor = { href: hrefMatch?.[1] ?? "#", content: "" };
      }
    } else if (/^<\/a>/i.test(tag)) {
      if (currentAnchor) {
        nodes.push(
          <a
            key={key++}
            href={currentAnchor.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800">
            {currentAnchor.content}
          </a>
        );
        currentAnchor = null;
      }
    }
    // Note: Other tags (like <b>, <strong>) are matched by tagRegex but ignored here,
    // which effectively strips them, preserving the original component's behavior.

    lastIndex = tagRegex.lastIndex;
  }

  // Handle any remaining text after the last match
  const remaining = html.slice(lastIndex);
  if (currentAnchor) {
    // If an <a> was left open, treat its content as plain text
    nodes.push(currentAnchor.content + remaining);
  } else if (remaining) {
    nodes.push(remaining);
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

  const hasHtmlTags = isHtml || /<[a-z][^>]*>/i.test(message);

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
