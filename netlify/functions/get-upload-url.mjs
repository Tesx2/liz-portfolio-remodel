import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  getR2Client,
  getBucketName,
  getPublicMediaBaseUrl,
  verifyAdminSession,
  jsonResponse,
  errorResponse,
} from './_shared.mjs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
];

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', 401);
  }

  try {
    const { slug, assetId, filename, contentType, size } = JSON.parse(event.body || '{}');

    if (!slug || !assetId || !filename || !contentType) {
      return errorResponse('Missing required fields: slug, assetId, filename, contentType', 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return errorResponse(`Unsupported file type: ${contentType}`, 400);
    }

    // Max 100MB per file
    if (size && size > 100 * 1024 * 1024) {
      return errorResponse('File size exceeds 100MB limit', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `media/${slug}/${assetId}/${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate signed upload URL (expires in 15 minutes)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const publicBase = getPublicMediaBaseUrl();
    const publicUrl = publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : key;

    return jsonResponse({
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (err) {
    console.error('get-upload-url error:', err);
    return errorResponse(err.message || 'Failed generating upload URL', 500);
  }
};
