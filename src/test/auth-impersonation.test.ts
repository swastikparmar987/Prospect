import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  createSessionToken,
  verifySessionToken,
  revokeSessionToken,
  isSessionTokenRevoked,
  clearRevocationStore,
} from "../lib/auth";
import { POST as sessionPostHandler } from "../app/api/auth/session/route";
import { POST as logoutPostHandler } from "../app/api/auth/logout/route";

test("Priority 2 — Authentication Security & Impersonation Prevention Audit", async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    process.env = { ...originalEnv };
    clearRevocationStore();
  });

  await t.test("1. Reject unauthenticated arbitrary userId claim (Prevent account takeover)", async () => {
    process.env.AUTH_EXCHANGE_SECRET = "super-secret-internal-key-64-bytes-long-for-testing-purposes";

    const maliciousReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "admin_user_001",
        email: "admin@enterprise.com",
      }),
    });

    const res = await sessionPostHandler(maliciousReq);
    assert.equal(res.status, 401, "Must reject arbitrary userId without secret exchange key");
    const data = await res.json();
    assert.ok(data.error.includes("Claiming a specific userId requires"));
  });

  await t.test("2. Reject invalid secretExchangeKey", async () => {
    process.env.AUTH_EXCHANGE_SECRET = "super-secret-internal-key-64-bytes-long-for-testing-purposes";

    const badSecretReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "target_victim_user",
        secretExchangeKey: "wrong-password",
      }),
    });

    const res = await badSecretReq.json ? await sessionPostHandler(badSecretReq) : null;
    assert.ok(res);
    assert.equal(res.status, 401);
  });

  await t.test("3. Allow authorized identity exchange with correct secret", async () => {
    const validSecret = "super-secret-internal-key-64-bytes-long-for-testing-purposes";
    process.env.AUTH_EXCHANGE_SECRET = validSecret;

    const authorizedReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "authorized_student_42",
        email: "authorized@college.edu",
        secretExchangeKey: validSecret,
      }),
    });

    const res = await sessionPostHandler(authorizedReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.userId, "authorized_student_42");
    assert.ok(data.token);
  });

  await t.test("4. Public self-registration assigns fresh unguessable user ID", async () => {
    const publicReq = new Request("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "newstudent@mit.edu",
      }),
    });

    const res = await sessionPostHandler(publicReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.user.userId.startsWith("usr_"), "Public registration must assign usr_ prefix");
    assert.notEqual(data.user.userId, "default", "Must not assign dev default");
    assert.equal(data.user.email, "newstudent@mit.edu");
  });

  await t.test("5. Persistent token revocation across simulated server restart", async () => {
    const user = { userId: "restart_test_user", email: "restart@prospect.ai" };
    const token = createSessionToken(user);
    const verifiedBefore = verifySessionToken(token);
    assert.ok(verifiedBefore);
    assert.ok(verifiedBefore.tokenId);

    const tokenId = verifiedBefore.tokenId;

    // Call logout route to revoke
    const logoutReq = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const logoutRes = await logoutPostHandler(logoutReq);
    assert.equal(logoutRes.status, 200);

    // Verify token is now revoked
    assert.equal(isSessionTokenRevoked(tokenId), true);
    assert.equal(verifySessionToken(token), null);

    // Verify persisted on disk in .data/revoked_tokens.json
    const diskPath = path.join(process.cwd(), ".data", "revoked_tokens.json");
    assert.ok(fs.existsSync(diskPath), "Revocation file must exist on disk");
    const diskContent = JSON.parse(fs.readFileSync(diskPath, "utf-8"));
    assert.ok(
      diskContent.some((entry: any) => entry.tokenId === tokenId),
      "Revocation file must contain the revoked tokenId"
    );
  });
});
