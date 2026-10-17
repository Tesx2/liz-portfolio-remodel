import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', 401);
  }

  try {
    const project = JSON.parse(event.body || '{}');
    if (!project.slug || !project.title) {
      return errorResponse('Project slug and title are required', 400);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    project.updatedAt = new Date().toISOString();

    // 1. Write content/projects/<slug>.json
    const projectKey = `content/projects/${project.slug}.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: projectKey,
        ContentType: 'application/json',
        Body: JSON.stringify(project, null, 2),
        CacheControl: 'public, max-age=30, must-revalidate',
      })
    );

    // 2. Scan and rebuild content/index.json
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'content/projects/',
      })
    );

    const indexItems = [];

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
          const p = JSON.parse(bodyStr);

          // Only include published projects in index.json
          if (p.status === 'published') {
            const cover =
              p.assets?.find((a) => a.id === p.coverAssetId) || p.assets?.[0];

            indexItems.push({
              id: p.id,
              slug: p.slug,
              title: p.title,
              client: p.client,
              year: p.year,
              category: p.category,
              summary: p.summary,
              featured: !!p.featured,
              sortOrder: p.sortOrder || 99,
              coverAsset: cover
                ? {
                    url: cover.url,
                    thumbUrl: cover.thumbUrl || cover.url,
                    width: cover.width,
                    height: cover.height,
                    alt: cover.alt || p.title,
                    type: cover.type,
                  }
                : null,
              updatedAt: p.updatedAt,
            });
          }
        } catch (readErr) {
          console.warn('Could not parse project file:', obj.Key, readErr);
        }
      }
    }

    indexItems.sort((a, b) => a.sortOrder - b.sortOrder);

    // 3. Write content/index.json
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: 'content/index.json',
        ContentType: 'application/json',
        Body: JSON.stringify(indexItems, null, 2),
        CacheControl: 'public, max-age=30, must-revalidate',
      })
    );

    return jsonResponse({
      success: true,
      project,
      indexCount: indexItems.length,
    });
  } catch (err) {
    console.error('save-project error:', err);
    return errorResponse(err.message || 'Failed saving project', 500);
  }
};
