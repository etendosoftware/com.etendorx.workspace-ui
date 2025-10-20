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

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  const components: Components = {
    // Paragraphs
    p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,

    // Headings
    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-bold mb-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-sm font-semibold mb-2">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-semibold mb-2">{children}</h6>,

    // Lists
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 pl-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 pl-4">{children}</ol>,
    li: ({ children }) => <li className="text-sm mb-1">{children}</li>,

    // Code blocks
    code: ({ className, children }) => {
      // Inline code doesn't have language- prefix in className
      const isInline = !className?.includes("language-");
      if (isInline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-(--color-transparent-neutral-10) text-(--color-baseline-90) font-mono text-xs">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-(--color-transparent-neutral-10) p-3 rounded-lg mb-2 overflow-x-auto">
          <code className={`font-mono text-xs block ${className || ""}`}>{children}</code>
        </pre>
      );
    },

    // Links
    a: ({ href, children }) => (
      <a href={href} className="text-(--color-dynamic-main) hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-(--color-transparent-neutral-30) pl-4 italic mb-2 text-(--color-transparent-neutral-70)">
        {children}
      </blockquote>
    ),

    // Strong/Bold
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,

    // Emphasis/Italic
    em: ({ children }) => <em className="italic">{children}</em>,

    // Horizontal Rule
    hr: () => <hr className="my-4 border-t border-(--color-transparent-neutral-20)" />,

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-2">
        <table className="min-w-full border-collapse border border-(--color-transparent-neutral-20)">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-(--color-transparent-neutral-5)">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-(--color-transparent-neutral-20)">{children}</tr>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold border border-(--color-transparent-neutral-20)">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-sm border border-(--color-transparent-neutral-20)">{children}</td>
    ),
  };

  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
};

export default MarkdownMessage;
