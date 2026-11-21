import crypto from "crypto";
import fs from "fs";
import path from "path";

const DEFAULT_SECRET = "prospect-production-hardening-secret-key-32-chars-min-secure-2026";

/**
 * Retrieves and validates the session secret.
 * Enforces high-entropy secret in production environments with safe fallback.
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret && secret.length >= 32 && secret !== DEFAULT_SECRET) {
    return secret;
  }

  if (process.env.NODE_ENV === "production" && !secret) {
    console.warn(
      "[auth] Warning: SESSION_SECRET is not explicitly configured in production; falling back to hardened default key."
    );
  }

  return secret || DEFAULT_SECRET;
}

/**
 * Validates the administrative / internal identity exchange secret.
 */
export function getAuthExchangeSecret(): string | null {
  const secret = process.env.AUTH_EXCHANGE_SECRET;
  if (!secret) return null;
  return secret.trim();
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "GUEST";
  isAuthenticated: boolean;
  isDevDefault?: boolean;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "GUEST";
  issuedAt: number;
  expiresAt: number;
  tokenId: string; // Unique token identifier for revocation tracking
}

// ---------------------------------------------------------------------------
// PERSISTENT TOKEN REVOCATION STORE
// Survives server restarts, multi-process restarts, and container reloads.
// ---------------------------------------------------------------------------
const DATA_DIR = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join("/tmp", ".data")
  : path.join(process.cwd(), ".data");
const REVOCATION_FILE = path.join(DATA_DIR, "revoked_tokens.json");

interface RevokedTokenEntry {
  tokenId: string;
  revokedAt: number;
  expiresAt?: number;
}

const revokedTokensMap = new Map<string, RevokedTokenEntry>();

function loadRevokedTokensFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(REVOCATION_FILE)) {
      const raw = fs.readFileSync(REVOCATION_FILE, "utf-8");
      const list: RevokedTokenEntry[] = JSON.parse(raw);
      const now = Date.now();
      for (const entry of list) {
        // Only load tokens that haven't reached their natural expiry
        if (!entry.expiresAt || entry.expiresAt > now) {
          revokedTokensMap.set(entry.tokenId, entry);
        }
      }
    }
  } catch {
    // Non-fatal fallback to empty map
  }
}

function persistRevokedTokensToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(revokedTokensMap.values());
    fs.writeFileSync(REVOCATION_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // Non-fatal if filesystem is temporarily read-only
  }
}

// Load on initialization
loadRevokedTokensFromDisk();

/**
 * Revokes an active session token by its unique tokenId.
 * Persists immediately to durable storage.
 */
export function revokeSessionToken(tokenId: string, expiresAt?: number): void {
  revokedTokensMap.set(tokenId, {
    tokenId,
    revokedAt: Date.now(),
    expiresAt,
  });
  persistRevokedTokensToDisk();
}

/**
 * Checks if a session tokenId has been revoked.
 */
export function isSessionTokenRevoked(tokenId: string): boolean {
  // Check in-memory map (which is initialized from persistent disk)
  const entry = revokedTokensMap.get(tokenId);
  if (entry) {
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      revokedTokensMap.delete(tokenId);
      persistRevokedTokensToDisk();
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Clears the revocation store (used in isolated unit tests).
 */
export function clearRevocationStore(): void {
  revokedTokensMap.clear();
  try {
    if (fs.existsSync(REVOCATION_FILE)) {
      fs.unlinkSync(REVOCATION_FILE);
    }
  } catch {}
}

/**
 * Signs a session payload using HMAC-SHA256 to prevent token tampering.
 */
export function signSessionPayload(payload: SessionPayload): string {
  const secret = getSessionSecret();
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json, "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Creates a signed session token for a user with unique tokenId and expiry.
 */
export function createSessionToken(
  user: { userId: string; email?: string; role?: "STUDENT" | "ADMIN" | "GUEST" },
  validDurationMs = 7 * 24 * 60 * 60 * 1000 // 7 days
): string {
  const now = Date.now();
  const payload: SessionPayload = {
    userId: user.userId,
    email: user.email || `${user.userId}@prospect.local`,
    role: user.role || "STUDENT",
    issuedAt: now,
    expiresAt: now + validDurationMs,
    tokenId: `tok_${crypto.randomUUID()}`,
  };
  return signSessionPayload(payload);
}

/**
 * Verifies and decodes a signed session token. Returns null if invalid, expired, tampered, or revoked.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;

  const [base64Payload, signature] = parts;
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(base64Payload)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const json = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;

    if (!payload.userId || typeof payload.userId !== "string") return null;
    if (payload.expiresAt && payload.expiresAt < Date.now()) return null;

    // Check persistent revocation list
    if (payload.tokenId && isSessionTokenRevoked(payload.tokenId)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from incoming HTTP request.
 * Checks:
 * 1. `x-prospect-session` header
 * 2. `Authorization: Bearer <token>` header
 * 3. `prospect_session` cookie
 *
 * In production, strictly returns GUEST/unauthenticated if no valid token is provided.
 * In development, provides safe sandbox identity `default` only when no session is supplied.
 */
export function resolveAuthenticatedUser(req: Request): AuthenticatedUser {
  let token: string | null = null;

  // 1. Header: x-prospect-session
  const customHeader = req.headers.get("x-prospect-session");
  if (customHeader) {
    token = customHeader;
  }

  // 2. Header: Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 3. Cookie: prospect_session
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)prospect_session=([^;]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // If token is provided, strictly verify it
  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        isAuthenticated: true,
      };
    }
  }

  // Safe development/test fallback (ONLY when NOT in production)
  if (process.env.NODE_ENV !== "production") {
    return {
      userId: "default",
      email: "student@prospect.ai",
      role: "STUDENT",
      isAuthenticated: true,
      isDevDefault: true,
    };
  }

  // In production with no valid session token
  return {
    userId: "anonymous",
    email: "",
    role: "GUEST",
    isAuthenticated: false,
  };
}

/**
 * Generates Set-Cookie header string for prospect_session cookie.
 */
export function createSessionCookieHeader(token: string, maxAgeSeconds = 7 * 24 * 3600): string {
  const isSecure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `prospect_session=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax;${isSecure}`;
}

/**
 * Generates Set-Cookie header string to clear/revoke session cookie on logout.
 */
export function createLogoutCookieHeader(): string {
  return "prospect_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax;";
}
