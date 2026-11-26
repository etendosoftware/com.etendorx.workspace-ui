/**
 * The role, organization and warehouse a login opened, read from the `meta/session` answer the UI loads right
 * after it. The `app` fixture compares them with the profile a test asks for and only opens the profile menu
 * (and saves it as the user's default) when they differ: in a run, every login after the first already lands
 * in the default the first one saved. In CI that menu cost ~7 s of every test (ETP-6295).
 */

/** The request the UI sends to load the session after logging in. */
export const SESSION_REQUEST = /\/meta\/session(?:\?|$)/;

/** Names of the role, organization and warehouse of a session; a missing one is undefined. */
export interface SessionProfile {
  role?: string;
  organization?: string;
  warehouse?: string;
}

interface NamedEntity {
  name?: string;
  _identifier?: string;
}

interface SessionAnswer {
  currentRole?: NamedEntity;
  currentOrganization?: NamedEntity;
  currentWarehouse?: NamedEntity | null;
}

const nameOf = (entity?: NamedEntity | null) => entity?.name ?? entity?._identifier;

/** The profile of a `meta/session` answer. */
export function profileOfSession(answer: unknown): SessionProfile {
  const session = (answer ?? {}) as SessionAnswer;
  return {
    role: nameOf(session.currentRole),
    organization: nameOf(session.currentOrganization),
    warehouse: nameOf(session.currentWarehouse),
  };
}

/** Whether the session already has the role and organization asked for, and a warehouse. */
export function hasProfile(session: SessionProfile | undefined, roleName: string, organizationName: string): boolean {
  return Boolean(session?.warehouse) && session?.role === roleName && session?.organization === organizationName;
}
