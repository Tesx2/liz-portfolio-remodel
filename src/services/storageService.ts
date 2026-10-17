import { Project, ProjectAsset, ProjectIndexItem } from '../types';

// Security Requirement: Delete any previously stored copies of R2 secrets or JWT tokens from localStorage on load
try {
  localStorage.removeItem('liz_kendi_r2_config_v2');
  localStorage.removeItem('liz_kendi_jwt_token');
  localStorage.removeItem('liz_kendi_admin_session_v2');
} catch {
  // Ignore
}

const PUBLIC_MEDIA_URL_KEY = 'liz_kendi_public_media_url';

export const getPublicMediaBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.PUBLIC_MEDIA_BASE_URL || (import.meta as any).env?.VITE_PUBLIC_MEDIA_BASE_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/$/, '');
  }
  const stored = localStorage.getItem(PUBLIC_MEDIA_URL_KEY);
  if (stored) return stored.replace(/\/$/, '');
  return '';
};

export const savePublicMediaBaseUrl = (url: string): void => {
  if (url) {
    localStorage.setItem(PUBLIC_MEDIA_URL_KEY, url.trim().replace(/\/$/, ''));
  } else {
    localStorage.removeItem(PUBLIC_MEDIA_URL_KEY);
  }
};

/**
 * Resolve full public URL from an R2 object key
 */
export const getMediaAssetUrl = (keyOrUrl?: string | null): string => {
  if (!keyOrUrl) return '';
  if (
    keyOrUrl.startsWith('http://') ||
    keyOrUrl.startsWith('https://') ||
    keyOrUrl.startsWith('blob:') ||
    keyOrUrl.startsWith('data:')
  ) {
    return keyOrUrl;
  }
  const baseUrl = getPublicMediaBaseUrl();
  const cleanKey = keyOrUrl.replace(/^\/+/, '');
  return baseUrl ? `${baseUrl}/${cleanKey}` : `/${cleanKey}`;
};

/**
 * Check admin session via HttpOnly cookie
 */
export const checkAdminSession = async (): Promise<boolean> => {
  try {
    const res = await fetch('/.netlify/functions/admin-session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Log out and clear HttpOnly cookie
 */
export const logoutAdminSession = async (): Promise<void> => {
  try {
    await fetch('/.netlify/functions/admin-logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // Ignore
  }
};

/**
 * Fetch published index for the public grid from Cloudflare R2
 */
export const fetchPublicProjectsIndex = async (): Promise<ProjectIndexItem[]> => {
  const baseUrl = getPublicMediaBaseUrl();
  const url = baseUrl
    ? `${baseUrl}/content/index.json?v=${Date.now()}`
    : `/content/index.json?v=${Date.now()}`;

  const res = await fetch(url, {
    cache: 'no-cache',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to load index: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('Index format invalid');
  }

  return data;
};

/**
 * Fetch full project case study from Cloudflare R2 by slug
 */
export const fetchProjectBySlug = async (slug: string): Promise<Project> => {
  const baseUrl = getPublicMediaBaseUrl();
  const url = baseUrl
    ? `${baseUrl}/content/projects/${slug}.json?v=${Date.now()}`
    : `/content/projects/${slug}.json?v=${Date.now()}`;

  const res = await fetch(url, {
    cache: 'no-cache',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Project not found: ${res.status} ${res.statusText}`);
  }

  return res.json();
};

/**
 * Admin: Fetch all projects including drafts from R2 via protected Netlify function
 */
export const fetchAdminProjectsList = async (): Promise<Project[]> => {
  const res = await fetch('/.netlify/functions/list-projects', {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed fetching projects: ${res.statusText}`);
  }

  const data = await res.json();
  return data.projects || [];
};

/**
 * Admin: Save project JSON to R2 and rebuild index.json
 */
export const saveProjectToR2 = async (project: Project): Promise<{ project: Project }> => {
  const res = await fetch('/.netlify/functions/save-project', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Save failed: ${res.statusText}`);
  }

  return res.json();
};

/**
 * Admin: Delete project from R2 (JSON and all media objects under media/<slug>/)
 */
export const deleteProjectFromR2 = async (slug: string): Promise<void> => {
  const res = await fetch('/.netlify/functions/delete-project', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Delete failed: ${res.statusText}`);
  }
};

/**
 * Admin: Delete specific asset keys from R2
 */
export const deleteAssetFromR2 = async (keys: string[]): Promise<void> => {
  const res = await fetch('/.netlify/functions/delete-asset', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Delete asset failed: ${res.statusText}`);
  }
};

/**
 * Admin: Trigger Netlify production build hook
 */
export const triggerProductionBuild = async (): Promise<void> => {
  const res = await fetch('/.netlify/functions/trigger-publish', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed triggering publish');
  }
};

/**
 * Generate client-side WebP thumbnail from image file using canvas
 */
export const generateImageThumbnailBlob = (
  file: File,
  maxWidth = 800
): Promise<{ blob: Blob; previewUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const aspect = img.width / img.height;
      const targetWidth = Math.min(img.width, maxWidth);
      const targetHeight = Math.round(targetWidth / aspect);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            resolve({ blob, previewUrl, width: img.width, height: img.height });
          } else {
            reject(new Error('Thumbnail blob conversion failed'));
          }
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed loading image for thumbnail generation'));
    };

    img.src = objectUrl;
  });
};

/**
 * Extract video poster frame at second 1 using canvas
 */
export const extractVideoPosterBlob = (
  file: File
): Promise<{ blob: Blob; previewUrl: string; width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1.0, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(fileUrl);
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            resolve({
              blob,
              previewUrl,
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration,
            });
          } else {
            reject(new Error('Poster blob conversion failed'));
          }
        },
        'image/webp',
        0.85
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Failed reading video file'));
    };
  });
};

/**
 * Single-part direct upload to Cloudflare R2 using presigned URL with XMLHttpRequest progress
 */
export const uploadFileDirectToR2 = async (
  fileOrBlob: File | Blob,
  params: {
    projectSlug: string;
    assetId: string;
    fileName: string;
    contentType: string;
    variant?: 'original' | 'thumb' | 'poster';
  },
  onProgress?: (percent: number) => void
): Promise<{ key: string }> => {
  // 1. Request presigned URL from server
  const urlRes = await fetch('/.netlify/functions/get-upload-url', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectSlug: params.projectSlug,
      assetId: params.assetId,
      fileName: params.fileName,
      contentType: params.contentType,
      size: fileOrBlob.size,
      variant: params.variant || 'original',
    }),
  });

  if (!urlRes.ok) {
    const err = await urlRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed getting upload URL: ${urlRes.statusText}`);
  }

  const { uploadUrl, key } = await urlRes.json();

  // 2. PUT file bytes directly to Cloudflare R2 with progress
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', params.contentType);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`R2 upload rejected with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during R2 upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(fileOrBlob);
  });

  return { key };
};

/**
 * Multipart upload for files over 50 MB (splits into 10 MB parts, up to 3 concurrent parts, retries up to 3 times)
 */
export const uploadFileMultipartToR2 = async (
  file: File,
  params: {
    projectSlug: string;
    assetId: string;
    fileName: string;
    contentType: string;
  },
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<{ key: string }> => {
  const PART_SIZE = 10 * 1024 * 1024; // 10 MB chunks
  const totalParts = Math.ceil(file.size / PART_SIZE);

  // 1. Initiate multipart upload on server
  const initRes = await fetch('/.netlify/functions/multipart-create', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectSlug: params.projectSlug,
      assetId: params.assetId,
      contentType: params.contentType,
      size: file.size,
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed creating multipart upload: ${initRes.statusText}`);
  }

  const { uploadId, key } = await initRes.json();

  let completedBytes = 0;
  const parts: { PartNumber: number; ETag: string }[] = [];

  const uploadPartWithRetry = async (partNumber: number): Promise<void> => {
    const start = (partNumber - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const chunk = file.slice(start, end);

    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (signal?.aborted) {
        throw new Error('Upload cancelled');
      }

      try {
        // Sign part URL
        const signRes = await fetch('/.netlify/functions/multipart-sign-part', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            uploadId,
            partNumber,
          }),
        });

        if (!signRes.ok) {
          throw new Error(`Failed signing part ${partNumber}`);
        }

        const { signedUrl } = await signRes.json();

        // PUT part bytes directly to R2
        const etag = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', signedUrl, true);

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const resETag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag');
              if (!resETag) {
                reject(new Error(`Missing ETag header on part ${partNumber}`));
              } else {
                resolve(resETag.replace(/"/g, ''));
              }
            } else {
              reject(new Error(`Part ${partNumber} failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Network error on part ${partNumber}`));
          xhr.onabort = () => reject(new Error('Part upload aborted'));

          xhr.send(chunk);
        });

        parts.push({ PartNumber: partNumber, ETag: `"${etag}"` });
        completedBytes += chunk.size;
        if (onProgress) {
          onProgress(Math.min(99, Math.round((completedBytes / file.size) * 100)));
        }
        return;
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error(`Part ${partNumber} failed after 3 attempts`);
  };

  try {
    // Parallel queue with limit of 3 concurrent part uploads
    const queue: number[] = Array.from({ length: totalParts }, (_, i) => i + 1);
    const pool: Promise<void>[] = [];
    const concurrency = 3;

    for (let i = 0; i < concurrency && queue.length > 0; i++) {
      const nextPart = queue.shift()!;
      const run = async () => {
        await uploadPartWithRetry(nextPart);
        while (queue.length > 0) {
          const next = queue.shift()!;
          await uploadPartWithRetry(next);
        }
      };
      pool.push(run());
    }

    await Promise.all(pool);

    // Complete multipart upload
    const completeRes = await fetch('/.netlify/functions/multipart-complete', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        uploadId,
        parts,
      }),
    });

    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => ({}));
      throw new Error(err.error || 'Failed completing multipart upload');
    }

    if (onProgress) onProgress(100);
    return { key };
  } catch (err) {
    // Abort multipart on failure
    fetch('/.netlify/functions/multipart-abort', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId }),
    }).catch(() => {});
    throw err;
  }
};
