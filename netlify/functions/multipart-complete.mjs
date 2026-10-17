import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
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
    const { key, uploadId, parts } = JSON.parse(event.body || '{}');

    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return errorResponse('Missing key, uploadId, or parts array', 400);
    }

    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    const s3 = getR2Client();
    const bucket = getBucketName();

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts.map((p) => ({
          PartNumber: p.PartNumber,
          ETag: p.ETag,
        })),
      },
    });

    await s3.send(command);

    return jsonResponse({
      success: true,
      key,
    });
  } catch (err) {
    console.error('multipart-complete error:', err);
    return errorResponse(err.message || 'Failed completing multipart upload', 500);
  }
};
