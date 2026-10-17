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
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-prod';
  return new TextEncoder().encode(secret);
};

export const verifyAdminSession = async (req) => {
  try {
    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Check Cookie header
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/admin_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      return { authorized: false, error: 'Authentication required' };
    }

    const { payload } = await jose.jwtVerify(token, getJwtSecret());
    if (payload.role !== 'admin') {
      return { authorized: false, error: 'Unauthorized role' };
    }

    return { authorized: true, user: payload };
  } catch (err) {
    return { authorized: false, error: 'Invalid or expired session token' };
  }
};

export const jsonResponse = (data, statusCode = 200, extraHeaders = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
};

export const errorResponse = (message, statusCode = 400) => {
  return jsonResponse({ error: message }, statusCode);
};
