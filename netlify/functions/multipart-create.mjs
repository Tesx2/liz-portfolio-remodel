import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
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
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method Not Allowed', 405);

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const { projectSlug, assetId, contentType, size } = JSON.parse(event.body || '{}');

    if (!projectSlug || !assetId || !contentType) {
      return errorResponse('Missing projectSlug, assetId, or contentType', 400);
    }

    if (!ALLOWED_CONTENT_TYPES[contentType]) {
      return errorResponse(`Unsupported content type: ${contentType}`, 400);
    }

    // Max 2 GB for multipart
    const MAX_MULTIPART_SIZE = 2 * 1024 * 1024 * 1024;
    if (size && size > MAX_MULTIPART_SIZE) {
      return errorResponse('File exceeds 2 GB limit', 400);
    }

    const cleanSlug = projectSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleanAssetId = assetId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const ext = ALLOWED_CONTENT_TYPES[contentType] || 'bin';
    const key = `media/${cleanSlug}/${cleanAssetId}/original.${ext}`;

    const validKeyRegex = /^media\/[a-z0-9_-]+\/[a-z0-9_-]+\/original\.[a-z0-9]+$/;
    if (!validKeyRegex.test(key)) {
      return errorResponse('Key format rejected by security policy', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const res = await s3.send(command);

    return jsonResponse({
      uploadId: res.UploadId,
      key,
    });
  } catch (err) {
    console.error('multipart-create error:', err);
    return errorResponse(err.message || 'Failed creating multipart upload', 500);
  }
};
