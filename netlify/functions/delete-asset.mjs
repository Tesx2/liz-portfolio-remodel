import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  getR2Client,
  getBucketName,
  verifyAdminSession,
  jsonResponse,
  errorResponse,
} from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return errorResponse('Method Not Allowed', 405);
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const { key, thumbKey, posterKey, keys } = JSON.parse(event.body || '{}');

    const keysToDelete = Array.isArray(keys) ? [...keys] : [];
    if (key) keysToDelete.push(key);
    if (thumbKey) keysToDelete.push(thumbKey);
    if (posterKey) keysToDelete.push(posterKey);

    const s3 = getR2Client();
    const bucket = getBucketName();

    for (const k of keysToDelete) {
      if (typeof k === 'string' && k.startsWith('media/')) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
        } catch (delErr) {
          console.warn('Failed deleting key:', k, delErr);
        }
      }
    }

    return jsonResponse({ success: true, deletedKeys: keysToDelete });
  } catch (err) {
    console.error('delete-asset error:', err);
    return errorResponse(err.message || 'Failed deleting asset', 500);
  }
};
