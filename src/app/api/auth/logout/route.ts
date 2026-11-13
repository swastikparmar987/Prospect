import { NextResponse } from "next/server";
import {
  createLogoutCookieHeader,
  verifySessionToken,
  revokeSessionToken,
} from "@/lib/auth";

export async function POST(req: Request) {
  // Extract token from cookie or header to add to persistent revocation list
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)prospect_session=([^;]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (token) {
    const payload = verifySessionToken(token);
    if (payload?.tokenId) {
      revokeSessionToken(payload.tokenId, payload.expiresAt);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully. Session permanently revoked across server restarts.",
  });

  response.headers.append("Set-Cookie", createLogoutCookieHeader());
  return response;
}
