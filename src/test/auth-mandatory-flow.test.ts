import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  createSessionToken,
  verifySessionToken,
  resolveAuthenticatedUser,
  revokeSessionToken,
  isSessionTokenRevoked,
  clearRevocationStore,
  createSessionCookieHeader,
  createLogoutCookieHeader,
} from "../lib/auth";
import { POST as sessionPostHandler } from "../app/api/auth/session/route";
import { POST as logoutPostHandler } from "../app/api/auth/logout/route";

test("Mandatory Authentication & Authorization Security Flow Suite", async (t) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalExchangeSecret = process.env.AUTH_EXCHANGE_SECRET;
  const originalSessionSecret = process.env.SESSION_SECRET;

  t.afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalExchangeSecret !== undefined) {
      process.env.AUTH_EXCHANGE_SECRET = originalExchangeSecret;
    } else {
      delete process.env.AUTH_EXCHANGE_SECRET;
    }
    if (originalSessionSecret !== undefined) {
      process.env.SESSION_SECRET = originalSessionSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
    clearRevocationStore();
  });

  // =========================================================================
  // 1. MANDATORY SESSION TOKEN REQUIREMENT
  // =========================================================================
  await t.test("1. Mandatory Session Token: Valid signed token grants authenticated access", () => {
    const studentUser = {
      userId: "usr_student_verified_99",
      email: "student@stanford.edu",
      role: "STUDENT" as const,
    };

    const token = createSessionToken(studentUser, 24 * 3600 * 1000);
    assert.ok(token, "Session token must be created");
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "Token must follow Base64URL payload.signature format");

    // Verify token payload extraction
    const payload = verifySessionToken(token);
    assert.ok(payload, "Payload must be verified successfully");
    assert.equal(payload.userId, "usr_student_verified_99");
    assert.equal(payload.email, "student@stanford.edu");
    assert.equal(payload.role, "STUDENT");
    assert.ok(payload.tokenId.startsWith("tok_"), "Session must have unique tokenId for revocation tracking");
    assert.ok(payload.expiresAt > Date.now(), "Token must not be expired");

    // Verify resolveAuthenticatedUser via Authorization Bearer header
    const reqWithBearer = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const userFromBearer = resolveAuthenticatedUser(reqWithBearer);
    assert.equal(userFromBearer.isAuthenticated, true);
    assert.equal(userFromBearer.userId, "usr_student_verified_99");

    // Verify resolveAuthenticatedUser via prospect_session cookie
    const reqWithCookie = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        cookie: createSessionCookieHeader(token),
      },
    });
    const userFromCookie = resolveAuthenticatedUser(reqWithCookie);
    assert.equal(userFromCookie.isAuthenticated, true);
    assert.equal(userFromCookie.userId, "usr_student_verified_99");
  });

  await t.test("2. Mandatory Session Token: Unauthenticated access in production blocks workspace", () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      process.env.SESSION_SECRET = "production-test-secret-at-least-32-chars-long";

      const unauthenticatedReq = new Request("http://localhost:3000/api/auth/session", {
        headers: {},
      });

      const user = resolveAuthenticatedUser(unauthenticatedReq);
      assert.equal(user.isAuthenticated, false, "Must block unauthenticated access in production");
      assert.equal(user.userId, "anonymous");
      assert.equal(user.role, "GUEST");
    } finally {
      process.env.NODE_ENV = prevEnv;
      delete process.env.SESSION_SECRET;
    }
  });

  // =========================================================================
  // 2. UNAUTHENTICATED ACCESS BLOCKS OR PROMPTS LOGIN & LOGOUT REVOCATION
  // =========================================================================
  await t.test("3. Logout Mechanism: Session invalidation and permanent disk revocation", async () => {
    const studentUser = {
      userId: "usr_logout_student_77",
      email: "logout.test@mit.edu",
      role: "STUDENT" as const,
    };

    const token = createSessionToken(studentUser);
    const verifiedBefore = verifySessionToken(token);
    assert.ok(verifiedBefore);
    const tokenId = verifiedBefore.tokenId;

    // Send POST to /api/auth/logout with the session token
    const logoutReq = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const logoutRes = await logoutPostHandler(logoutReq);
    assert.equal(logoutRes.status, 200);

    const logoutData = await logoutRes.json();
    assert.equal(logoutData.success, true);
    assert.ok(logoutData.message.includes("permanently revoked"));

    // Verify Set-Cookie header clears the prospect_session cookie
    const cookieHeader = logoutRes.headers.get("set-cookie") || "";
    assert.ok(cookieHeader.includes("Max-Age=0") || cookieHeader.includes("Expires=Thu, 01 Jan 1970"));

    // Verify token is revoked and cannot be verified
    assert.equal(isSessionTokenRevoked(tokenId), true, "Token must be recorded as revoked");
    assert.equal(verifySessionToken(token), null, "Revoked token verification must return null");

    // Verify persistent revocation on disk in .data/revoked_tokens.json
    const diskPath = path.join(process.cwd(), ".data", "revoked_tokens.json");
    assert.ok(fs.existsSync(diskPath), "Revocation log must persist on disk");
    const rawDisk = fs.readFileSync(diskPath, "utf-8");
    const entries = JSON.parse(rawDisk);
    assert.ok(entries.some((e: any) => e.tokenId === tokenId), "Revocation file must contain revoked tokenId");
  });

  // =========================================================================
  // 3. ANTI-TAMPERING & IMPERSONATION PREVENTION
  // =========================================================================
  await t.test("4. Anti-Tampering: Forged payload signature is strictly rejected", () => {
    const legitUser = {
      userId: "usr_regular_student",
      email: "student@univ.edu",
      role: "STUDENT" as const,
    };

    const validToken = createSessionToken(legitUser);
    const [b64Payload, sig] = validToken.split(".");

    // Attacker modifies payload to claim ADMIN or a different userId
    const payloadObj = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    payloadObj.role = "ADMIN";
    payloadObj.userId = "usr_admin_target";
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadObj), "utf-8").toString("base64url");
    const tamperedToken = `${tamperedPayloadB64}.${sig}`;

    const verified = verifySessionToken(tamperedToken);
    assert.equal(verified, null, "Tampered token must be completely rejected");
  });

  await t.test("5. Anti-Tampering: Arbitrary userId claims without secretExchangeKey are rejected (401)", async () => {
    process.env.AUTH_EXCHANGE_SECRET = "mandatory-security-exchange-key-32-chars-long";

    const impersonationReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "target_victim_student_42",
        email: "victim@stanford.edu",
      }),
    });

    const res = await sessionPostHandler(impersonationReq);
    assert.equal(res.status, 401, "Must reject arbitrary client-supplied userId without secret exchange key");
    const data = await res.json();
    assert.ok(data.error.includes("account impersonation"), "Must cite impersonation prevention in error");
  });

  await t.test("6. Anti-Tampering: Wrong secretExchangeKey is rejected with 401", async () => {
    process.env.AUTH_EXCHANGE_SECRET = "mandatory-security-exchange-key-32-chars-long";

    const badKeyReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "target_victim_student_42",
        secretExchangeKey: "wrong-malicious-attempt",
      }),
    });

    const res = await sessionPostHandler(badKeyReq);
    assert.equal(res.status, 401, "Must reject invalid secret exchange key");
  });

  await t.test("7. Legitimate Self-Registration / 1-Click Demo generates fresh unguessable userId", async () => {
    const demoReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@prospect.ai",
        role: "STUDENT",
      }),
    });

    const res = await sessionPostHandler(demoReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token, "Must return signed session token");
    assert.ok(data.user.userId.startsWith("usr_"), "User ID must be freshly generated with usr_ prefix");
    assert.equal(data.user.email, "student@prospect.ai");

    // Verify cookie was set
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Must set session cookie");
    assert.ok(setCookie.includes("prospect_session="));
    assert.ok(setCookie.includes("HttpOnly"));
  });

  await t.test("8. Authorized Internal Exchange succeeds with valid secretExchangeKey", async () => {
    const validSecret = "mandatory-security-exchange-key-32-chars-long";
    process.env.AUTH_EXCHANGE_SECRET = validSecret;

    const exchangeReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "verified_enterprise_candidate_10",
        email: "candidate@partner.edu",
        role: "STUDENT",
        secretExchangeKey: validSecret,
      }),
    });

    const res = await sessionPostHandler(exchangeReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.userId, "verified_enterprise_candidate_10");
    assert.ok(data.token);
  });
});
