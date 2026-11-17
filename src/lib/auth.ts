import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './db';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SESSION_SECRET,
  TokenPayload,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from './auth-token';

export {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SESSION_SECRET,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
};
export type { TokenPayload };

export interface UserSession {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: string;
}

/**
 * Extracts session token from Request headers or cookies
 */
export function extractTokenFromRequest(req?: Request): string | null {
  if (!req) return null;

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie header
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookiesList = cookieHeader.split(';').map((c) => c.trim());
    for (const c of cookiesList) {
      if (c.startsWith(`${SESSION_COOKIE_NAME}=`)) {
        return decodeURIComponent(c.substring(SESSION_COOKIE_NAME.length + 1));
      }
    }
  }

  return null;
}

/**
 * Retrieves the currently authenticated user from the request
 */
export async function getCurrentUser(req?: Request): Promise<UserSession | null> {
  let token = extractTokenFromRequest(req);

  // If token not in request headers, check Next.js cookies API
  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookieObj = cookieStore.get(SESSION_COOKIE_NAME);
      token = cookieObj?.value || null;
    } catch {
      // Cookies API not available in some contexts
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (user) return user;
    return {
      id: payload.userId,
      username: payload.username,
      name: payload.username === 'admin' ? 'Raj Soni' : payload.username,
      role: payload.role || 'admin',
    };
  } catch (error) {
    console.error('Error fetching session user:', error);
    return {
      id: payload.userId,
      username: payload.username,
      name: payload.username === 'admin' ? 'Raj Soni' : payload.username,
      role: payload.role || 'admin',
    };
  }
}

/**
 * Middleware / Guard helper: enforces authentication on API route handlers.
 * Returns { user } if authenticated, or a 401 NextResponse if unauthenticated.
 */
export async function requireAuth(
  req?: Request
): Promise<{ user: UserSession; errorResponse?: never } | { user?: never; errorResponse: NextResponse }> {
  const user = await getCurrentUser(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required to perform this action.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Middleware / Guard helper: enforces admin role on API route handlers.
 */
export async function requireAdmin(
  req?: Request
): Promise<{ user: UserSession; errorResponse?: never } | { user?: never; errorResponse: NextResponse }> {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth;

  if (auth.user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Administrator privileges required.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}
