import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import {
  getR2Client,
  getBucketName,
  verifyAdminSession,
  jsonResponse,
  errorResponse,
} from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return errorResponse('Method Not Allowed', 405);
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', 401);
  }

  try {
    const { slug } = JSON.parse(event.body || '{}');
    if (!slug) {
      return errorResponse('Project slug is required', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    // 1. Delete project JSON
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: `content/projects/${slug}.json`,
      })
    );

    // 2. Delete media folder under media/<slug>/
    const mediaList = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `media/${slug}/`,
      })
    );

    if (mediaList.Contents) {
      for (const item of mediaList.Contents) {
        if (item.Key) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: item.Key,
            })
          );
        }
      }
    }

    return jsonResponse({ success: true, deletedSlug: slug });
  } catch (err) {
    console.error('delete-project error:', err);
    return errorResponse(err.message || 'Failed deleting project', 500);
  }
};
