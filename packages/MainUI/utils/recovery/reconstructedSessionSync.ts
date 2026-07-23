import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";
import type { SessionSyncTarget } from "./stateReconstructor";
import type { EntityData, ISession } from "@workspaceui/api-client/src/api/types";

interface SessionSyncDeps {
  setSession: (updater: (prev: ISession) => ISession) => void;
  setSessionSyncLoading: (loading: boolean) => void;
}

/**
 * Establishes the Classic session context for every record reconstructed during
 * URL-driven recovery (linked-item navigation, reload). Runs a SETSESSION sync per
 * tab in root -> leaf order so parent context is set before children.
 *
 * Why this is needed: recovered parent tabs are selected programmatically (grid mode),
 * so they never fire the grid-selection SETSESSION that normal navigation performs.
 * Their `<windowId>|<column>` session attributes therefore stay unset and backend
 * calls that read them (e.g. the linked-items UsedByLink servlet) fail with
 * "Session attribute required: <windowId>|<column>".
 *
 * A minimal `{ id: recordId }` record is sent; the backend loads the record by ROW_ID
 * and stores its columns, which is enough to establish the required attributes.
 * `syncSelectedRecordsToSession` swallows its own errors, so one failing tab does not
 * abort the rest of the chain.
 */
export const syncReconstructedHierarchyToSession = async (
  targets: SessionSyncTarget[],
  { setSession, setSessionSyncLoading }: SessionSyncDeps
): Promise<void> => {
  for (const { tab, recordId, parentId } of targets ?? []) {
    await syncSelectedRecordsToSession({
      tab,
      selectedRecords: [{ id: recordId } as EntityData],
      parentId: parentId ?? undefined,
      setSession,
      setSessionSyncLoading,
    });
  }
};
