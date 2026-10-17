import { S3Client } from '@aws-sdk/client-s3';
import * as jose from 'jose';

export const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials missing from environment variables');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const getBucketName = () => {
  return process.env.R2_BUCKET || 'portfolio-media';
};

export const getPublicMediaBaseUrl = () => {
  return process.env.PUBLIC_MEDIA_BASE_URL || '';
};

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or shorter than 32 characters');
  }
  return new TextEncoder().encode(secret);
};

export const validateSameOrigin = (req) => {
  const method = (req.httpMethod || '').toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true;
  }

  const origin = req.headers.origin || req.headers.Origin;
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHost = (
      req.headers['x-forwarded-host'] ||
      req.headers.host ||
      ''
    ).toLowerCase();

    if (requestHost && originHost !== requestHost) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
};

export const verifyAdminSession = async (req) => {
  // Reject cross-site state-changing requests
  if (!validateSameOrigin(req)) {
    return { authorized: false, error: 'Cross-origin request rejected', status: 403 };
  }

  try {
    // Read from httpOnly cookie
    let token = null;
    if (req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    // Fallback: check Authorization Bearer header if same-origin API call
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return { authorized: false, error: 'Authentication required', status: 401 };
    }

    const { payload } = await jose.jwtVerify(token, getJwtSecret());
    if (payload.role !== 'admin') {
      return { authorized: false, error: 'Unauthorized role', status: 401 };
    }

    return { authorized: true, user: payload, status: 200 };
  } catch (err) {
    return { authorized: false, error: 'Invalid or expired session token', status: 401 };
  }
};

export const jsonResponse = (data, statusCode = 200, extraHeaders = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
};

export const errorResponse = (message, statusCode = 400) => {
  return jsonResponse({ error: message }, statusCode);
};
