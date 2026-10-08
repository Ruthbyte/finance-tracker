import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const SESSION_COOKIE_NAME = "ft_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "finance-tracker-default-super-secret-key-2026-hmac-sha256"
  );
}

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64");
}

/**
 * Hashes a plaintext password using scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored password hash using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }
    const [, salt, keyHex] = parts;
    const keyBuffer = Buffer.from(keyHex, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Signs a stateless JWT-style session token using HMAC-SHA256.
 */
export function signSessionToken(
  user: { id: string; username: string; email: string },
  durationMs: number = SESSION_DURATION_MS
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + durationMs);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadObj: SessionPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    exp: expiresAt.getTime(),
  };
  const payload = base64UrlEncode(JSON.stringify(payloadObj));
  const signingInput = `${header}.${payload}`;
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", getSecretKey()).update(signingInput).digest()
  );
  return {
    token: `${signingInput}.${signature}`,
    expiresAt,
  };
}

/**
 * Verifies a stateless session token and returns its payload if valid and not expired.
 */
export function verifySessionToken(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const signingInput = `${header}.${payload}`;
    const expectedSig = crypto
      .createHmac("sha256", getSecretKey())
      .update(signingInput)
      .digest();
    const actualSig = base64UrlDecode(signature);
    if (
      expectedSig.length !== actualSig.length ||
      !crypto.timingSafeEqual(expectedSig, actualSig)
    ) {
      return null;
    }
    const parsed = JSON.parse(
      base64UrlDecode(payload).toString("utf8")
    ) as SessionPayload;
    if (!parsed.userId || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sets the HTTP-only session cookie on the server.
 */
export async function setSessionCookie(user: {
  id: string;
  username: string;
  email: string;
}) {
  const { token, expiresAt } = signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
  return { token, expiresAt };
}

/**
 * Deletes the session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Reads and verifies the current session from cookies without hitting the database.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Fetches the authenticated user record from the database based on the session cookie.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });
    return user;
  } catch (error) {
    console.error("Failed to fetch current user from database:", error);
    return null;
  }
}

export const INITIAL_USER_SEED = {
  accounts: {
    create: [
      {
        name: "Main Checking",
        type: "CHECKING" as const,
        balance: 0.0,
        currency: "NGN",
        accountNumber: "*4921",
        color: "#10b981",
        isDefault: true,
      },
      {
        name: "High-Yield Savings",
        type: "SAVINGS" as const,
        balance: 0.0,
        currency: "NGN",
        accountNumber: "*8832",
        color: "#6366f1",
      },
    ],
  },
  categories: {
    create: [
      { name: "Salary", type: "INCOME" as const, icon: "briefcase", color: "#10b981" },
      { name: "Freelance", type: "INCOME" as const, icon: "laptop", color: "#14b8a6" },
      { name: "Groceries", type: "EXPENSE" as const, icon: "shopping-cart", color: "#f59e0b" },
      { name: "Dining & Drinks", type: "EXPENSE" as const, icon: "utensils", color: "#ef4444" },
      { name: "Utilities & Bills", type: "EXPENSE" as const, icon: "zap", color: "#8b5cf6" },
      { name: "Transport", type: "EXPENSE" as const, icon: "car", color: "#06b6d4" },
    ],
  },
};

