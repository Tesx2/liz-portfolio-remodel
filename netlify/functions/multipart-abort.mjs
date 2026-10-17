import { AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
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
    const { key, uploadId } = JSON.parse(event.body || '{}');

    if (!key || !uploadId) {
      return errorResponse('Missing key or uploadId', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });

    await s3.send(command);

    return jsonResponse({ success: true, message: 'Multipart upload aborted' });
  } catch (err) {
    console.error('multipart-abort error:', err);
    return errorResponse(err.message || 'Failed aborting multipart upload', 500);
  }
};
