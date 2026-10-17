import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  getR2Client,
  getBucketName,
  verifyAdminSession,
  jsonResponse,
  errorResponse,
} from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method Not Allowed', 405);

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const { key, uploadId, partNumber } = JSON.parse(event.body || '{}');

    if (!key || !uploadId || !partNumber) {
      return errorResponse('Missing key, uploadId, or partNumber', 400);
    }

    const validKeyRegex = /^media\/[a-z0-9_-]+\/[a-z0-9_-]+\/original\.[a-z0-9]+$/;
    if (!validKeyRegex.test(key)) {
      return errorResponse('Invalid key format', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: Number(partNumber),
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return jsonResponse({
      signedUrl,
      partNumber: Number(partNumber),
    });
  } catch (err) {
    console.error('multipart-sign-part error:', err);
    return errorResponse(err.message || 'Failed signing part URL', 500);
  }
};
