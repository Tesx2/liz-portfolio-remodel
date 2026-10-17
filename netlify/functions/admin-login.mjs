import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { getJwtSecret, jsonResponse, errorResponse } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
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
      // Intentional delay to prevent brute-force attacks
      await new Promise((resolve) => setTimeout(resolve, 800));
      return errorResponse('Invalid admin password', 401);
    }

    // Sign JWT valid for 7 days
    const secret = getJwtSecret();
    const token = await new jose.SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const isProd = process.env.NODE_ENV === 'production';
    const cookie = `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${
      isProd ? '; Secure' : ''
    }`;

    return jsonResponse(
      { success: true, token },
      200,
      { 'Set-Cookie': cookie }
    );
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Internal server error during authentication', 500);
  }
};
