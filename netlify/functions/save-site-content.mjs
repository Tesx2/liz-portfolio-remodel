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

    // Store clean keys, media, and managed sections in site.json
    const siteContent = {
      portraitKey: rawData.portraitKey ? String(rawData.portraitKey).trim() : null,
      showreelKey: rawData.showreelKey ? String(rawData.showreelKey).trim() : null,
      showreelPosterKey: rawData.showreelPosterKey ? String(rawData.showreelPosterKey).trim() : null,
      showreelLink: rawData.showreelLink ? String(rawData.showreelLink).trim() : '',
      heroLoopKey: rawData.heroLoopKey ? String(rawData.heroLoopKey).trim() : null,
      heroPosterKey: rawData.heroPosterKey ? String(rawData.heroPosterKey).trim() : null,

      // Managed Section 1: About Me
      about: rawData.about && typeof rawData.about === 'object' ? {
        title: rawData.about.title ? String(rawData.about.title).trim() : 'About me',
        roleTitle: rawData.about.roleTitle ? String(rawData.about.roleTitle).trim() : 'Graphic designer and animator',
        location: rawData.about.location ? String(rawData.about.location).trim() : 'Nairobi, KE',
        bioParagraphs: Array.isArray(rawData.about.bioParagraphs)
          ? rawData.about.bioParagraphs.map((p) => String(p).trim()).filter(Boolean)
          : [],
        cvDownloadUrl: rawData.about.cvDownloadUrl ? String(rawData.about.cvDownloadUrl).trim() : '',
        tools: Array.isArray(rawData.about.tools)
          ? rawData.about.tools.map((t) => ({
              name: String(t.name || '').trim(),
              category: String(t.category || '').trim(),
            })).filter((t) => t.name)
          : [],
        milestones: Array.isArray(rawData.about.milestones)
          ? rawData.about.milestones.map((m) => ({
              year: String(m.year || '').trim(),
              title: String(m.title || '').trim(),
              place: String(m.place || '').trim(),
            })).filter((m) => m.title)
          : [],
      } : null,

      // Managed Section 2: Services
      services: Array.isArray(rawData.services)
        ? rawData.services.map((s, idx) => ({
            id: s.id ? String(s.id) : `srv-${idx + 1}`,
            number: s.number ? String(s.number).trim() : String(idx + 1).padStart(2, '0'),
            title: String(s.title || '').trim(),
            category: String(s.category || '').trim(),
            description: String(s.description || '').trim(),
            deliverables: Array.isArray(s.deliverables)
              ? s.deliverables.map((d) => String(d).trim()).filter(Boolean)
              : [],
            timeline: s.timeline ? String(s.timeline).trim() : '',
            imageKey: s.imageKey ? String(s.imageKey).trim() : null,
            imageUrl: s.imageUrl ? String(s.imageUrl).trim() : null,
            iconName: s.iconName ? String(s.iconName).trim() : '',
            visible: s.visible !== false,
            sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : idx + 1,
          })).filter((s) => s.title)
        : null,

      // Managed Section 3: Testimonials
      testimonials: Array.isArray(rawData.testimonials)
        ? rawData.testimonials.map((t, idx) => ({
            id: t.id ? String(t.id) : `test-${idx + 1}`,
            quote: String(t.quote || '').trim(),
            clientName: String(t.clientName || '').trim(),
            role: String(t.role || '').trim(),
            company: String(t.company || '').trim(),
            project: t.project ? String(t.project).trim() : '',
            location: t.location ? String(t.location).trim() : '',
            imageKey: t.imageKey ? String(t.imageKey).trim() : null,
            imageUrl: t.imageUrl ? String(t.imageUrl).trim() : null,
            visible: t.visible !== false,
            sortOrder: typeof t.sortOrder === 'number' ? t.sortOrder : idx + 1,
          })).filter((t) => t.quote && t.clientName)
        : null,

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
