import type React from "react";

function parseHtmlToReact(html: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let currentAnchor: { href: string; content: string } | null = null;

  while (lastIndex < html.length) {
    const nextTagStart = html.indexOf("<", lastIndex);

    if (nextTagStart === -1) {
      // No more tags, append the rest
      const remaining = html.slice(lastIndex);
      if (currentAnchor) {
        currentAnchor.content += remaining;
      } else {
        nodes.push(remaining);
      }
      break;
    }

    // Process text before the tag
    const textBefore = html.slice(lastIndex, nextTagStart);
    if (currentAnchor) {
      currentAnchor.content += textBefore;
    } else if (textBefore) {
      nodes.push(textBefore);
    }

    const nextTagEnd = html.indexOf(">", nextTagStart);
    if (nextTagEnd === -1) {
      // Unclosed tag, treat the rest as plain text
      const remaining = html.slice(nextTagStart);
      if (currentAnchor) {
        currentAnchor.content += remaining;
      } else {
        nodes.push(remaining);
      }
      break;
    }

    const tag = html.slice(nextTagStart, nextTagEnd + 1);
    const tagName = tag.match(/^<(\/?[a-z0-9]+)/i)?.[1].toLowerCase();

    if (tagName === "br") {
      if (currentAnchor) {
        currentAnchor.content += "\n";
      } else {
        nodes.push(<br key={key++} />);
      }
    } else if (tagName === "a") {
      if (!currentAnchor) {
        const hrefMatch = tag.match(/href=["']([^"']*)["']/i);
        currentAnchor = { href: hrefMatch?.[1] ?? "#", content: "" };
      }
    } else if (tagName === "/a") {
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
    // Other tags are naturally ignored/stripped

    lastIndex = nextTagEnd + 1;
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

  const hasHtmlTags = isHtml || message.includes("<");

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
