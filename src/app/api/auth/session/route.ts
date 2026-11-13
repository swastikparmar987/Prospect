import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  resolveAuthenticatedUser,
  createSessionToken,
  createSessionCookieHeader,
  getAuthExchangeSecret,
} from "@/lib/auth";

export async function GET(req: Request) {
  const user = resolveAuthenticatedUser(req);
  return NextResponse.json({
    isAuthenticated: user.isAuthenticated,
    user: {
      userId: user.userId,
      email: user.email,
      role: user.role,
      isDevDefault: user.isDevDefault || false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId: requestedUserId, email, role, secretExchangeKey } = body;

    const configuredExchangeSecret = getAuthExchangeSecret();

    // -------------------------------------------------------------------------
    // SECURITY POLICY: PREVENT ARBITRARY USER ID IMPERSONATION
    // -------------------------------------------------------------------------
    let resolvedUserId: string;
    let resolvedRole: "STUDENT" | "ADMIN" = "STUDENT";

    if (requestedUserId && typeof requestedUserId === "string" && requestedUserId.trim().length > 0) {
      // Caller is attempting to claim or impersonate a specific user identity.
      // This is strictly restricted to trusted internal processes or pre-verified OAuth callbacks.
      const trimmedTargetId = requestedUserId.trim();

      if (!configuredExchangeSecret || secretExchangeKey !== configuredExchangeSecret) {
        return NextResponse.json(
          {
            error: "Unauthorized: Claiming a specific userId requires a valid administrative identity exchange key. Client-supplied userId is blocked to prevent account impersonation.",
          },
          { status: 401 }
        );
      }

      resolvedUserId = trimmedTargetId;
      resolvedRole = role === "ADMIN" ? "ADMIN" : "STUDENT";
    } else {
      // Public self-registration / onboarding session:
      // Generate a fresh, unguessable, cryptographically secure identifier.
      // Public callers can NEVER pick their own userId or hijack an existing profile.
      resolvedUserId = `usr_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
      resolvedRole = "STUDENT";
    }

    // Issue cryptographic token
    const token = createSessionToken({
      userId: resolvedUserId,
      email: email ? String(email).trim() : `${resolvedUserId}@prospect.local`,
      role: resolvedRole,
    });

    const cookieHeader = createSessionCookieHeader(token);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        userId: resolvedUserId,
        email: email ? String(email).trim() : `${resolvedUserId}@prospect.local`,
        role: resolvedRole,
      },
    });

    response.headers.append("Set-Cookie", cookieHeader);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error in session generation" },
      { status: 500 }
    );
  }
}
