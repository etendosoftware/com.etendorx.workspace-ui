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
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownMessageProps {
  content: string;
}

// Paragraph component
const Paragraph: Components["p"] = ({ children }) => <p className="text-sm mb-2 last:mb-0 break-words">{children}</p>;

// Heading components
const H1: Components["h1"] = ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>;
const H2: Components["h2"] = ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>;
const H3: Components["h3"] = ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>;
const H4: Components["h4"] = ({ children }) => <h4 className="text-sm font-bold mb-2">{children}</h4>;
const H5: Components["h5"] = ({ children }) => <h5 className="text-sm font-semibold mb-2">{children}</h5>;
const H6: Components["h6"] = ({ children }) => <h6 className="text-sm font-semibold mb-2">{children}</h6>;

// List components
const UnorderedList: Components["ul"] = ({ children }) => (
  <ul className="list-disc list-inside mb-2 pl-4 break-words">{children}</ul>
);
const OrderedList: Components["ol"] = ({ children }) => (
  <ol className="list-decimal list-inside mb-2 pl-4 break-words">{children}</ol>
);
const ListItem: Components["li"] = ({ children }) => <li className="text-sm mb-1 break-words">{children}</li>;

// Code component
const Code: Components["code"] = ({ className, children }) => {
  // Inline code doesn't have language- prefix in className
  const isInline = !className?.includes("language-");
  if (isInline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-(--color-transparent-neutral-10) text-(--color-baseline-90) font-mono text-xs max-w-full inline-block"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
        {children}
      </code>
    );
  }
  return (
    <pre className="bg-(--color-transparent-neutral-10) p-3 rounded-lg mb-2 overflow-x-auto">
      <code className={`font-mono text-xs block ${className || ""}`} style={{ wordBreak: "break-word" }}>
        {children}
      </code>
    </pre>
  );
};

// Link component
const Link: Components["a"] = ({ href, children }) => (
  <a
    href={href}
    className="text-(--color-dynamic-main) hover:underline break-words max-w-full inline-block"
    target="_blank"
    rel="noopener noreferrer">
    {children}
  </a>
);

// Blockquote component
const Blockquote: Components["blockquote"] = ({ children }) => (
  <blockquote className="border-l-4 border-(--color-transparent-neutral-30) pl-4 italic mb-2 text-(--color-transparent-neutral-70) break-words">
    {children}
  </blockquote>
);

// Strong component
const Strong: Components["strong"] = ({ children }) => <strong className="font-bold">{children}</strong>;

// Emphasis component
const Emphasis: Components["em"] = ({ children }) => <em className="italic">{children}</em>;

// Horizontal Rule component
const HorizontalRule: Components["hr"] = () => <hr className="my-4 border-t border-(--color-transparent-neutral-20)" />;

// Table components
const Table: Components["table"] = ({ children }) => (
  <div className="overflow-x-auto mb-2">
    <table className="min-w-full border-collapse border border-(--color-transparent-neutral-20)">{children}</table>
  </div>
);
const TableHead: Components["thead"] = ({ children }) => (
  <thead className="bg-(--color-transparent-neutral-5)">{children}</thead>
);
const TableBody: Components["tbody"] = ({ children }) => <tbody>{children}</tbody>;
const TableRow: Components["tr"] = ({ children }) => (
  <tr className="border-b border-(--color-transparent-neutral-20)">{children}</tr>
);
const TableHeader: Components["th"] = ({ children }) => (
  <th className="px-3 py-2 text-left text-xs font-semibold border border-(--color-transparent-neutral-20)">
    {children}
  </th>
);
const TableCell: Components["td"] = ({ children }) => (
  <td className="px-3 py-2 text-sm border border-(--color-transparent-neutral-20) break-words">{children}</td>
);

const components: Components = {
  p: Paragraph,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  code: Code,
  a: Link,
  blockquote: Blockquote,
  strong: Strong,
  em: Emphasis,
  hr: HorizontalRule,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
};

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;
