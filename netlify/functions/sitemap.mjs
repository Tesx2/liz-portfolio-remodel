import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName } from './_shared.mjs';

const SITE_URL = (
  process.env.SITE_URL ||
  process.env.URL ||
  'https://lizkendiportfolio.netlify.app'
).replace(/\/+$/, '');

export const handler = async () => {
  let projects = [];

  // 1. Read from content/index.json on the public media address
  const mediaBase = (process.env.PUBLIC_MEDIA_BASE_URL || '').trim().replace(/\/+$/, '');
  if (mediaBase) {
    try {
      const res = await fetch(`${mediaBase}/content/index.json`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        projects = await res.json();
      }
    } catch (err) {
      console.warn('Sitemap: failed to fetch content/index.json from media address:', err);
    }
  }

  // 2. Fallback to direct R2 read if public media URL is unset or failed
  if (!Array.isArray(projects) || projects.length === 0) {
    try {
      const s3 = getR2Client();
      const bucket = getBucketName();
      const res = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: 'content/index.json',
        })
      );
      const text = await res.Body.transformToString();
      projects = JSON.parse(text);
    } catch {
      // Credentials might not be set in local environment; ignore
    }
  }

  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ];

  if (Array.isArray(projects)) {
    for (const p of projects) {
      if (p && p.slug) {
        const cleanSlug = encodeURIComponent(p.slug);
        let lastmodTag = '';
        if (p.updatedAt) {
          try {
            const dateStr = new Date(p.updatedAt).toISOString().split('T')[0];
            lastmodTag = `\n    <lastmod>${dateStr}</lastmod>`;
          } catch {
            // Ignore invalid date
          }
        }
        urls.push(
          `  <url>\n    <loc>${SITE_URL}/work/${cleanSlug}</loc>${lastmodTag}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
        );
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
    body: xml,
  };
};
