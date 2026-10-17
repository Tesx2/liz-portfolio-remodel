import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', 401);
  }

  try {
    const s3 = getR2Client();
    const bucket = getBucketName();

    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'content/projects/',
      })
    );

    const projects = [];
    if (listRes.Contents) {
      for (const obj of listRes.Contents) {
        if (!obj.Key || !obj.Key.endsWith('.json')) continue;
        try {
          const itemRes = await s3.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: obj.Key,
            })
          );
          const bodyStr = await itemRes.Body.transformToString();
          projects.push(JSON.parse(bodyStr));
        } catch (e) {
          console.warn('Failed reading project', obj.Key, e);
        }
      }
    }

    projects.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

    return jsonResponse({ projects });
  } catch (err) {
    console.error('list-projects error:', err);
    return errorResponse(err.message || 'Failed listing projects', 500);
  }
};
