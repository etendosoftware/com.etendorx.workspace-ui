import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export interface UserContext {
  userId: string;
  clientId: string;
  orgId: string;
  roleId: string;
}

/**
 * Extracts user context from the request for cache key generation
 * This ensures that cached data is properly isolated per user/role/client/org
 */
export async function getUserContext(request: NextRequest): Promise<UserContext | null> {
  try {
    // Option 1: Extract from request headers (custom headers from client)
    const userId = request.headers.get('X-User-ID');
    const clientId = request.headers.get('X-Client-ID');
    const orgId = request.headers.get('X-Org-ID');
    const roleId = request.headers.get('X-Role-ID');

    if (userId && clientId && orgId && roleId) {
      return { userId, clientId, orgId, roleId };
    }

    // Option 2: Extract from cookies
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId')?.value;
    const clientIdCookie = cookieStore.get('clientId')?.value;
    const orgIdCookie = cookieStore.get('orgId')?.value;
    const roleIdCookie = cookieStore.get('roleId')?.value;

    if (!userIdCookie || !clientIdCookie || !orgIdCookie || !roleIdCookie) {
      return null;
    }

    return {
      userId: userIdCookie,
      clientId: clientIdCookie,
      orgId: orgIdCookie,
      roleId: roleIdCookie,
    };
  } catch (error) {
    console.error('Error extracting user context:', error);
    return null;
  }
}

/**
 * Generates a unique cache key based on user context
 */
export function generateCacheKey(userContext: UserContext, entity: string, params: any): string {
  const contextKey = `${userContext.userId}-${userContext.clientId}-${userContext.orgId}-${userContext.roleId}`;
  const paramsKey = JSON.stringify(params);
  return `datasource-${contextKey}-${entity}-${btoa(paramsKey)}`;
}

/**
 * Validates that user context contains all required fields
 */
export function validateUserContext(userContext: Partial<UserContext>): userContext is UserContext {
  return !!(userContext.userId && userContext.clientId && userContext.orgId && userContext.roleId);
}

/**
 * Extracts Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

/**
 * Creates user context headers for ERP communication
 */
export function createUserContextHeaders(userContext: UserContext): Record<string, string> {
  return {
    'X-User-ID': userContext.userId,
    'X-Client-ID': userContext.clientId,
    'X-Org-ID': userContext.orgId,
    'X-Role-ID': userContext.roleId,
  };
}
