import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export interface UserContext {
  userId: string;
  clientId: string;
  orgId: string;
  roleId: string;
  warehouseId: string;
}

/**
 * Extracts user context from the request for cache key generation
 * This ensures that cached data is properly isolated per user/role/client/org
 */
export async function getUserContext(request: Request | NextRequest): Promise<UserContext | null> {
  try {
    // Preferred: derive user context by decoding the Bearer JWT
    const token = extractBearerToken(request);
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        const userId = stringy(payload.userId ?? payload.user ?? payload.sub);
        const clientId = stringy(payload.clientId ?? payload.client ?? payload.client_id);
        const orgId = stringy(
          payload.orgId ??
          payload.org ??
          payload.organization ??
          payload.organizationId ??
          payload.org_id
        );
        const roleId = stringy(payload.roleId ?? payload.role ?? payload.role_id);
        const warehouseId = stringy(payload.warehouseId ?? payload.warehouse ?? payload.warehouse_id);

        if (userId && clientId && orgId && roleId && warehouseId) {
          return { userId, clientId, orgId, roleId, warehouseId };
        }
      }
    }

    // Fallback: Extract from cookies if available (legacy)
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId')?.value;
    const clientIdCookie = cookieStore.get('clientId')?.value;
    const orgIdCookie = cookieStore.get('orgId')?.value;
    const roleIdCookie = cookieStore.get('roleId')?.value;
    const warehouseIdCookie = cookieStore.get('warehouseId')?.value || cookieStore.get('warehouse')?.value;

    if (userIdCookie && clientIdCookie && orgIdCookie && roleIdCookie && warehouseIdCookie) {
      return {
        userId: userIdCookie,
        clientId: clientIdCookie,
        orgId: orgIdCookie,
        roleId: roleIdCookie,
        warehouseId: warehouseIdCookie,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting user context:', error);
    return null;
  }
}

/**
 * Generates a unique cache key based on user context
 */
export function generateCacheKey(userContext: UserContext, entity: string, params: any): string {
  const contextKey = `${userContext.userId}-${userContext.clientId}-${userContext.orgId}-${userContext.roleId}-${userContext.warehouseId}`;
  const paramsKey = JSON.stringify(params);
  return `datasource-${contextKey}-${entity}-${btoa(paramsKey)}`;
}

/**
 * Validates that user context contains all required fields
 */
export function validateUserContext(userContext: Partial<UserContext>): userContext is UserContext {
  return !!(userContext.userId && userContext.clientId && userContext.orgId && userContext.roleId && userContext.warehouseId);
}

/**
 * Extracts Bearer token from Authorization header
 */
export function extractBearerToken(request: Request | NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function stringy(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  return null;
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
    'X-Warehouse-ID': userContext.warehouseId,
  };
}
