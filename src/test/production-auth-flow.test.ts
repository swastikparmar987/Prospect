import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSessionToken,
  verifySessionToken,
  resolveAuthenticatedUser,
  revokeSessionToken,
  createSessionCookieHeader,
  createLogoutCookieHeader,
  signSessionPayload,
} from "@/lib/auth";

test("Priority 2 — Production Authentication & Session Flow Suite", async (t) => {
  await t.test("1. Session Token Issuance & Cookie Generation", () => {
    const user = { userId: "usr_student_alpha", email: "alpha@univ.edu", role: "STUDENT" as const };
    const token = createSessionToken(user, 3600 * 1000); // 1 hour

    assert.ok(token);
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    const cookieHeader = createSessionCookieHeader(token);
    assert.match(cookieHeader, /^prospect_session=/);
    assert.ok(cookieHeader.includes("HttpOnly"));
    assert.ok(cookieHeader.includes("SameSite=Lax"));
    assert.ok(cookieHeader.includes("Path=/"));
  });

  await t.test("2. Valid Session Verification & Claim Extraction", () => {
    const user = { userId: "usr_student_beta", email: "beta@mit.edu", role: "STUDENT" as const };
    const token = createSessionToken(user, 3600 * 1000);

    const payload = verifySessionToken(token);
    assert.ok(payload);
    assert.equal(payload.userId, "usr_student_beta");
    assert.equal(payload.email, "beta@mit.edu");
    assert.equal(payload.role, "STUDENT");
    assert.ok(payload.tokenId.startsWith("tok_"));
    assert.ok(payload.expiresAt > Date.now());
  });

  await t.test("3. Session Expiration: Expired tokens are strictly rejected", () => {
    const user = { userId: "usr_expired", email: "expired@test.com" };
    // Issue token that expired 10 seconds ago
    const expiredToken = createSessionToken(user, -10000);

    const payload = verifySessionToken(expiredToken);
    assert.equal(payload, null);
  });

  await t.test("4. Anti-Tampering: Modified payload or signature is rejected", () => {
    const user = { userId: "usr_normal", email: "normal@test.com", role: "STUDENT" as const };
    const validToken = createSessionToken(user);
    const [payloadB64, sig] = validToken.split(".");

    // Attacker tampers payload to elevate to ADMIN
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    decoded.role = "ADMIN";
    const forgedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    const forgedToken = `${forgedPayloadB64}.${sig}`;

    const verified = verifySessionToken(forgedToken);
    assert.equal(verified, null, "Forged token must be rejected");
  });

  await t.test("5. Logout & Revocation: Revoked token is immediately invalidated", () => {
    const user = { userId: "usr_logout_test", email: "logout@test.com" };
    const token = createSessionToken(user, 3600 * 1000);

    // Initial check passes
    const beforeRevoke = verifySessionToken(token);
    assert.ok(beforeRevoke);

    // Logout revokes the token
    revokeSessionToken(beforeRevoke.tokenId);

    // Subsequent check fails even though expiry has not passed
    const afterRevoke = verifySessionToken(token);
    assert.equal(afterRevoke, null, "Revoked token must be rejected immediately");

    // Verify logout cookie header clears session
    const logoutCookie = createLogoutCookieHeader();
    assert.ok(logoutCookie.includes("Max-Age=0"));
    assert.ok(logoutCookie.includes("Expires=Thu, 01 Jan 1970"));
  });

  await t.test("6. Request Resolution across Cookie, Authorization header, and Custom header", () => {
    const tokenA = createSessionToken({ userId: "usr_cookie_auth" });
    const tokenB = createSessionToken({ userId: "usr_bearer_auth" });
    const tokenC = createSessionToken({ userId: "usr_header_auth" });

    // Cookie test
    const reqCookie = new Request("http://localhost:3000/api/profile", {
      headers: { cookie: `prospect_session=${encodeURIComponent(tokenA)}` },
    });
    const userFromCookie = resolveAuthenticatedUser(reqCookie);
    assert.equal(userFromCookie.userId, "usr_cookie_auth");
    assert.equal(userFromCookie.isAuthenticated, true);

    // Bearer header test
    const reqBearer = new Request("http://localhost:3000/api/profile", {
      headers: { authorization: `Bearer ${tokenB}` },
    });
    const userFromBearer = resolveAuthenticatedUser(reqBearer);
    assert.equal(userFromBearer.userId, "usr_bearer_auth");
    assert.equal(userFromBearer.isAuthenticated, true);

    // Custom header test
    const reqCustom = new Request("http://localhost:3000/api/profile", {
      headers: { "x-prospect-session": tokenC },
    });
    const userFromCustom = resolveAuthenticatedUser(reqCustom);
    assert.equal(userFromCustom.userId, "usr_header_auth");
    assert.equal(userFromCustom.isAuthenticated, true);
  });

  await t.test("7. Production Mode Identity Enforcement: Unauthenticated requests become GUEST", () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      // Temporarily simulate production
      (process.env as any).NODE_ENV = "production";

      const unauthenticatedReq = new Request("http://localhost:3000/api/profile", {
        headers: {},
      });

      const user = resolveAuthenticatedUser(unauthenticatedReq);
      assert.equal(user.isAuthenticated, false);
      assert.equal(user.userId, "anonymous");
      assert.equal(user.role, "GUEST");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });
});
