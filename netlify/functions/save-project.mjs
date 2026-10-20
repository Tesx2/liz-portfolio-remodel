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
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const rawProject = JSON.parse(event.body || '{}');
    if (!rawProject.slug || !rawProject.title) {
      return errorResponse('Project slug and title are required', 400);
    }

    const cleanSlug = rawProject.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const RESERVED_SLUGS = ['site', 'content', 'media', 'admin', 'api', 'new', 'work'];
    if (RESERVED_SLUGS.includes(cleanSlug)) {
      return errorResponse(`The project slug "${cleanSlug}" is reserved and cannot be used for a project.`, 400);
    }
    const now = new Date().toISOString();

    // Sanitize assets: store ONLY R2 object keys, strip any blob: or data: URIs
    const sanitizedAssets = (rawProject.assets || []).map((a, idx) => {
      // Ensure url is not data/blob
      const cleanUrl = a.url && (a.url.startsWith('blob:') || a.url.startsWith('data:')) ? '' : a.url;
      const cleanThumbUrl = a.thumbUrl && (a.thumbUrl.startsWith('blob:') || a.thumbUrl.startsWith('data:')) ? '' : a.thumbUrl;
      const cleanPosterUrl = a.posterUrl && (a.posterUrl.startsWith('blob:') || a.posterUrl.startsWith('data:')) ? '' : a.posterUrl;

      return {
        id: a.id || `asset-${idx + 1}`,
        type: a.type || 'image',
        key: a.key || `media/${cleanSlug}/${a.id}/original.jpg`,
        thumbKey: a.thumbKey || (a.key ? a.key.replace(/original\.[^.]+$/, 'thumb.webp') : null),
        posterKey: a.posterKey || null,
        previewKey: a.previewKey || null,
        url: cleanUrl || '',
        thumbUrl: cleanThumbUrl || '',
        posterUrl: cleanPosterUrl || '',
        width: a.width || null,
        height: a.height || null,
        duration: a.duration || null,
        size: a.size || null,
        alt: a.alt || rawProject.title,
        caption: a.caption || '',
        sortOrder: a.sortOrder || idx + 1,
      };
    });

    const projectToSave = {
      ...rawProject,
      slug: cleanSlug,
      assets: sanitizedAssets,
      updatedAt: now,
      createdAt: rawProject.createdAt || now,
    };

    const s3 = getR2Client();
    const bucket = getBucketName();

    // 1. Write content/projects/<slug>.json
    const projectKey = `content/projects/${cleanSlug}.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: projectKey,
        ContentType: 'application/json',
        Body: JSON.stringify(projectToSave, null, 2),
        CacheControl: 'public, max-age=30, must-revalidate',
      })
    );

    // 2. Scan and rebuild content/index.json from all published projects
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
                    key: cover.key,
                    thumbKey: cover.thumbKey || cover.key,
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
          console.warn('Could not parse project file during index rebuild:', obj.Key, readErr);
        }
      }
    }

    indexItems.sort((a, b) => a.sortOrder - b.sortOrder);

    // 3. Write content/index.json with Cache-Control
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
      project: projectToSave,
      indexCount: indexItems.length,
    });
  } catch (err) {
    console.error('save-project error:', err);
    return errorResponse(err.message || 'Failed saving project', 500);
  }
};
