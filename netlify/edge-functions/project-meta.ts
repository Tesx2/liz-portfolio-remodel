function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean); // ['work', '<slug>']
  const slug = pathParts[1] ? decodeURIComponent(pathParts[1]) : '';

  // If path is not /work/<slug>, pass through
  if (!slug) {
    return await context.next();
  }

  // Read site URL and media address from environment
  const siteUrl = (
    (typeof Deno !== 'undefined' ? Deno.env.get('SITE_URL') : null) ||
    'https://lizkendiportfolio.netlify.app'
  ).replace(/\/+$/, '');

  const mediaBaseUrl = (
    (typeof Deno !== 'undefined' ? Deno.env.get('PUBLIC_MEDIA_BASE_URL') : null) ||
    ''
  ).replace(/\/+$/, '');

  let project: any = null;
  let isMediaDown = false;

  if (mediaBaseUrl) {
    try {
      const res = await fetch(`${mediaBaseUrl}/content/projects/${encodeURIComponent(slug)}.json`, {
        headers: { Accept: 'application/json' },
      });
      if (res.status === 404) {
        project = null;
      } else if (res.ok) {
        project = await res.json();
      } else {
        isMediaDown = true;
      }
    } catch {
      isMediaDown = true;
    }
  } else {
    isMediaDown = true;
  }

  // Fallback to normal app page if media address is unreachable or unconfigured
  if (isMediaDown) {
    return await context.next();
  }

  // Missing or unpublished: return normal page with HTTP 404 and noindex
  if (!project || project.status !== 'published') {
    const response = await context.next();
    let html = await response.text();
    html = html.replace('<head>', '<head>\n    <meta name="robots" content="noindex">');
    return new Response(html, {
      status: 404,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-type': 'text/html; charset=utf-8',
      },
    });
  }

  // Project is published: rewrite HTML for crawlers and social share cards
  const response = await context.next();
  let html = await response.text();

  const projectTitle = `${project.title || 'Project'} | Liz Kendi`;
  const summaryRaw = project.summary || project.description || '';
  const projectSummary = summaryRaw.length > 155 ? `${summaryRaw.substring(0, 152)}...` : summaryRaw;
  const pageUrl = `${siteUrl}/work/${encodeURIComponent(slug)}`;

  // Find cover / thumbnail image
  const cover =
    (project.assets || []).find((a: any) => a.id === project.coverAssetId) ||
    (project.assets || [])[0];
  const coverKey = cover?.thumbKey || cover?.key || '';
  let imageUrl = `${siteUrl}/og-image.jpg`;
  if (coverKey.startsWith('http://') || coverKey.startsWith('https://')) {
    imageUrl = coverKey;
  } else if (coverKey && mediaBaseUrl) {
    imageUrl = `${mediaBaseUrl}/${coverKey.replace(/^\/+/, '')}`;
  }

  const escapedTitle = escapeHtml(projectTitle);
  const escapedSummary = escapeHtml(projectSummary);
  const escapedPageUrl = escapeHtml(pageUrl);
  const escapedImageUrl = escapeHtml(imageUrl);
  const escapedRawTitle = escapeHtml(project.title || '');
  const escapedClient = escapeHtml(project.client || '');
  const escapedYear = escapeHtml(project.year || '');
  const escapedDescription = escapeHtml(project.description || project.summary || '');

  // 1. Replace <title>
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapedTitle}</title>`);

  // 2. Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${escapedSummary}" />`
  );

  // 3. Replace canonical link
  html = html.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${escapedPageUrl}" />`
  );

  // 4. Replace OpenGraph tags
  html = html.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapedTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapedSummary}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${escapedPageUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:image" content="${escapedImageUrl}" />`
  );

  // 5. Replace Twitter tags
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapedTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapedSummary}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapedImageUrl}" />`
  );

  // 6. Add CreativeWork JSON-LD
  const creativeWorkJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title || '',
    description: project.summary || project.description || '',
    image: imageUrl,
    creator: {
      '@type': 'Person',
      name: 'Liz Kendi',
    },
    dateCreated: String(project.year || project.createdAt || ''),
    url: pageUrl,
  });

  const creativeWorkScript = `\n    <script type="application/ld+json">\n    ${creativeWorkJsonLd}\n    </script>`;
  html = html.replace('</head>', `${creativeWorkScript}\n  </head>`);

  // 7. Crawler content inside <div id="root">
  const assetMarkup = (project.assets || [])
    .map((a: any) => {
      const aKey = a.thumbKey || a.key || '';
      let aUrl = `${siteUrl}/og-image.jpg`;
      if (aKey.startsWith('http://') || aKey.startsWith('https://')) {
        aUrl = aKey;
      } else if (aKey && mediaBaseUrl) {
        aUrl = `${mediaBaseUrl}/${aKey.replace(/^\/+/, '')}`;
      }
      const alt = escapeHtml(a.alt || project.title || 'Project showcase visual');
      const w = a.width ? ` width="${escapeHtml(a.width)}"` : '';
      const h = a.height ? ` height="${escapeHtml(a.height)}"` : '';
      return `        <figure>\n          <img src="${escapeHtml(aUrl)}" alt="${alt}"${w}${h} loading="lazy" />\n          <figcaption>${alt}</figcaption>\n        </figure>`;
    })
    .join('\n');

  const crawlerHtml = `<div id="root">
      <article>
        <h1>${escapedRawTitle}</h1>
        <p><strong>Client:</strong> ${escapedClient} · <strong>Year:</strong> ${escapedYear}</p>
        <p class="summary">${escapedSummary}</p>
        <div class="description">
          <p>${escapedDescription}</p>
        </div>
        <div class="project-assets">
${assetMarkup}
        </div>
        <p><a href="/">← Back to all projects by Liz Kendi</a></p>
      </article>
    </div>`;

  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, crawlerHtml);

  return new Response(html, {
    status: 200,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html; charset=utf-8',
    },
  });
};
