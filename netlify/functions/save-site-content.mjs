import { PutObjectCommand } from '@aws-sdk/client-s3';
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
    const rawData = JSON.parse(event.body || '{}');

    // Store only clean keys and link in site.json
    const siteContent = {
      portraitKey: rawData.portraitKey ? String(rawData.portraitKey).trim() : null,
      showreelKey: rawData.showreelKey ? String(rawData.showreelKey).trim() : null,
      showreelPosterKey: rawData.showreelPosterKey ? String(rawData.showreelPosterKey).trim() : null,
      showreelLink: rawData.showreelLink ? String(rawData.showreelLink).trim() : '',
      heroLoopKey: rawData.heroLoopKey ? String(rawData.heroLoopKey).trim() : null,
      heroPosterKey: rawData.heroPosterKey ? String(rawData.heroPosterKey).trim() : null,
      updatedAt: new Date().toISOString(),
    };

    const s3 = getR2Client();
    const bucket = getBucketName();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: 'content/site.json',
        ContentType: 'application/json',
        Body: JSON.stringify(siteContent, null, 2),
        CacheControl: 'public, max-age=30, must-revalidate',
      })
    );

    return jsonResponse({ success: true, site: siteContent });
  } catch (err) {
    console.error('save-site-content error:', err.message);
    return errorResponse(err.message || 'Failed saving site content', 500);
  }
};
