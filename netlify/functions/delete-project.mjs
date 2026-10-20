import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
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
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const rawSlug = JSON.parse(event.body || '{}').slug;
    if (!rawSlug) {
      return errorResponse('Project slug is required', 400);
    }

    const cleanSlug = String(rawSlug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const RESERVED_SLUGS = ['site', 'content', 'media', 'admin', 'api', 'new', 'work'];
    if (RESERVED_SLUGS.includes(cleanSlug)) {
      return errorResponse(`The project slug "${cleanSlug}" is reserved and cannot be deleted as a project.`, 400);
    }

    // Safety guard: delete-project must NEVER touch media/site/
    const mediaPrefix = `media/${cleanSlug}/`;
    if (cleanSlug === 'site' || mediaPrefix.startsWith('media/site/')) {
      return errorResponse('Forbidden: cannot touch protected site assets', 403);
    }

    const s3 = getR2Client();
    const bucket = getBucketName();

    // 1. Delete project JSON
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: `content/projects/${cleanSlug}.json`,
      })
    );

    // 2. Delete media folder under media/<cleanSlug>/
    const mediaList = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: mediaPrefix,
      })
    );

    if (mediaList.Contents) {
      for (const item of mediaList.Contents) {
        if (item.Key && !item.Key.startsWith('media/site/')) {
          try {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: bucket,
                Key: item.Key,
              })
            );
          } catch (e) {
            console.warn('Failed deleting item:', item.Key, e);
          }
        }
      }
    }

    // 3. Rebuild content/index.json from remaining published projects
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
                    thumbKey: cover.thumbKey,
                    key: cover.key,
                    width: cover.width,
                    height: cover.height,
                    alt: cover.alt || p.title,
                    type: cover.type,
                  }
                : null,
              updatedAt: p.updatedAt,
            });
          }
        } catch (e) {
          console.warn('Error parsing project during index rebuild:', obj.Key, e);
        }
      }
    }

    indexItems.sort((a, b) => a.sortOrder - b.sortOrder);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: 'content/index.json',
        ContentType: 'application/json',
        Body: JSON.stringify(indexItems, null, 2),
        CacheControl: 'public, max-age=30, must-revalidate',
      })
    );

    return jsonResponse({ success: true, deletedSlug: slug, remainingIndexCount: indexItems.length });
  } catch (err) {
    console.error('delete-project error:', err);
    return errorResponse(err.message || 'Failed deleting project', 500);
  }
};
