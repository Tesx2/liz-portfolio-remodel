import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import {
  getJwtSecret,
  validateSameOrigin,
  jsonResponse,
  errorResponse,
} from './_shared.mjs';

// In-memory rate-limiter by IP: 5 failed attempts -> 15 min lockout
const failedAttempts = new Map();

const getClientIp = (event) => {
  const xForwardedFor = event.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return (
    event.headers['client-ip'] ||
    event.headers['x-real-ip'] ||
    event.headers['x-nf-client-connection-ip'] ||
    'anonymous'
  );
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  // Reject cross-origin POST requests
  if (!validateSameOrigin(event)) {
    return errorResponse('Cross-origin request rejected', 403);
  }

  const ip = getClientIp(event);
  const now = Date.now();
  const ipRecord = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };

  // Check if IP is currently locked out
  if (ipRecord.lockedUntil > now) {
    const minutesLeft = Math.ceil((ipRecord.lockedUntil - now) / 60000);
    return jsonResponse(
      { error: `Too many failed login attempts. Locked for ${minutesLeft} more minute(s).` },
      429
    );
  }

  try {
    const { password } = JSON.parse(event.body || '{}');
    if (!password) {
      return errorResponse('Password is required', 400);
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      return errorResponse('Server ADMIN_PASSWORD_HASH not configured', 500);
    }

    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      // Record failed attempt
      ipRecord.count += 1;
      if (ipRecord.count >= 5) {
        ipRecord.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
      }
      failedAttempts.set(ip, ipRecord);

      // Mandatory 600ms wait before replying to wrong password
      await new Promise((resolve) => setTimeout(resolve, 600));
      return errorResponse('Invalid admin credentials', 401);
    }

    // Reset IP failed count on successful authentication
    failedAttempts.delete(ip);

    // Sign JWT valid for 7 days
    const secret = getJwtSecret();
    const token = await new jose.SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // HttpOnly, Secure, SameSite=Strict cookie. DO NOT return token in JSON body.
    const cookie = `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800; Secure`;

    return jsonResponse(
      { success: true, authenticated: true },
      200,
      { 'Set-Cookie': cookie }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    return errorResponse('Authentication service error', 500);
  }
};
