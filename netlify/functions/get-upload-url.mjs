import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  getR2Client,
  getBucketName,
  verifyAdminSession,
  jsonResponse,
  errorResponse,
} from './_shared.mjs';

const ALLOWED_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'application/json': 'json',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { fileName, contentType, size, projectSlug, assetId, variant = 'original' } = body;

    if (!projectSlug || !assetId || !contentType) {
      return errorResponse('Missing required fields: projectSlug, assetId, contentType', 400);
    }

    // Slug and assetId sanitization check
    const cleanSlug = projectSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleanAssetId = assetId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    if (!cleanSlug || !cleanAssetId) {
      return errorResponse('Invalid slug or assetId', 400);
    }

    if (!ALLOWED_CONTENT_TYPES[contentType]) {
      return errorResponse(`Disallowed content type: ${contentType}`, 400);
    }

    // Single-part upload limit is 50 MB
    const MAX_SINGLE_UPLOAD_SIZE = 50 * 1024 * 1024;
    if (size && size > MAX_SINGLE_UPLOAD_SIZE) {
      return errorResponse('File exceeds 50 MB single-part upload limit. Use multipart upload.', 400);
    }

    let key = '';
    if (variant === 'thumb') {
      key = `media/${cleanSlug}/${cleanAssetId}/thumb.webp`;
    } else if (variant === 'poster') {
      key = `media/${cleanSlug}/${cleanAssetId}/poster.webp`;
    } else {
      const ext = ALLOWED_CONTENT_TYPES[contentType] || 'bin';
      key = `media/${cleanSlug}/${cleanAssetId}/original.${ext}`;
    }

    // Strict key verification: media/<slug>/<assetId>/original.<ext>
    const validKeyRegex = /^media\/[a-z0-9_-]+\/[a-z0-9_-]+\/(original\.[a-z0-9]+|thumb\.webp|poster\.webp)$/;
    if (!validKeyRegex.test(key)) {
      return errorResponse('Key format rejected by security policy', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return jsonResponse({
      uploadUrl,
      key,
    });
  } catch (err) {
    console.error('get-upload-url error:', err.message);
    return errorResponse(err.message || 'Failed generating upload URL', 500);
  }
};
