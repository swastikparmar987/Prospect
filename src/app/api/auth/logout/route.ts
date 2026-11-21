import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    // Wipe out the user's uploaded profile, applications, and session data
    if (payload?.userId) {
      try {
        await prisma.userProfile.deleteMany({
          where: { userId: payload.userId },
        });
        await prisma.application.deleteMany({
          where: { userId: payload.userId },
        });
        await prisma.preparationPlan.deleteMany({
          where: { userId: payload.userId },
        });
        await prisma.agentRun.deleteMany({
          where: { userId: payload.userId },
        });
      } catch (err) {
        console.warn("[logout] Non-fatal user data cleanup notice:", err);
      }
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully. Session permanently revoked and user data wiped.",
  });

  response.headers.append("Set-Cookie", createLogoutCookieHeader());
  return response;
}
