import { CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";

interface ContextItem {
  contextString: string;
}

interface BuildContextStringOptions {
  contextItems: ContextItem[];
  registersText: string;
}

export const buildContextString = ({ contextItems, registersText }: BuildContextStringOptions): string => {
  if (contextItems.length === 0) {
    return "";
  }

  const recordsData = contextItems.map((item) => item.contextString);
  const count = contextItems.length;

  return `${CONTEXT_CONSTANTS.TAG_START} (${count} ${registersText}):\n\n${recordsData.join("\n\n---\n\n")}${CONTEXT_CONSTANTS.TAG_END}`;
};
