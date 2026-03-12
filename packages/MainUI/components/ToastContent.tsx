import type React from "react";

function parseHtmlToReact(html: string): React.ReactNode[] {
  const stack: { name: string; props: any; children: React.ReactNode[] }[] = [
    { name: "root", props: {}, children: [] },
  ];
  let lastIndex = 0;
  let key = 0;

  const current = () => stack[stack.length - 1];

  const handleStartTag = (tag: string, name: string) => {
    const props: any = { key: key++ };
    if (name === "a") {
      const hrefMatch = tag.match(/href=["']([^"']*)["']/i);
      Object.assign(props, {
        href: hrefMatch?.[1] ?? "#",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-600 underline hover:text-blue-800",
      });
    }
    stack.push({ name, props, children: [] });
  };

  const handleEndTag = (name: string) => {
    if (stack.length > 1 && current().name === name) {
      const { name: tagName, props, children } = stack.pop()!;
      const Element = tagName as any;
      current().children.push(
        <Element {...props} data-testid="Element__4d7de7">
          {children}
        </Element>
      );
    }
  };

  const handleTag = (tag: string) => {
    const match = tag.match(/^<(\/?)([a-z0-9]+)/i);
    if (!match) return;
    const [_, isEnd, name] = match.map((s) => s?.toLowerCase());
    if (name === "br") {
      current().children.push(<br key={key++} />);
    } else if (["a", "b", "strong", "i", "em", "u"].includes(name)) {
      if (isEnd) handleEndTag(name);
      else handleStartTag(tag, name);
    }
  };

  while (lastIndex < html.length) {
    const start = html.indexOf("<", lastIndex);
    if (start === -1) {
      current().children.push(html.slice(lastIndex));
      break;
    }
    current().children.push(html.slice(lastIndex, start));
    const end = html.indexOf(">", start);
    if (end === -1) {
      current().children.push(html.slice(start));
      break;
    }
    handleTag(html.slice(start, end + 1));
    lastIndex = end + 1;
  }

  while (stack.length > 1) {
    const { children } = stack.pop()!;
    current().children.push(...children);
  }
  return stack[0].children;
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
