import { Project, ProjectAsset, ProjectIndexItem, R2Config } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';

const STORAGE_KEY_PROJECTS = 'liz_kendi_portfolio_projects_v2';
const STORAGE_KEY_R2_CONFIG = 'liz_kendi_r2_config_v2';
const STORAGE_KEY_ADMIN_TOKEN = 'liz_kendi_admin_session_v2';

export const getStoredR2Config = (): R2Config => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_R2_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading R2 config', e);
  }
  return {
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucket: 'portfolio-media',
    publicMediaBaseUrl: 'https://media.lizkendi.com',
    buildHookUrl: '',
    isConfigured: false,
  };
};

export const saveR2Config = (config: R2Config): void => {
  localStorage.setItem(STORAGE_KEY_R2_CONFIG, JSON.stringify(config));
};

export const getStoredProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading stored projects', e);
  }
  // Default to initial seed
  return INITIAL_PROJECTS;
};

export const saveAllProjects = (projects: Project[]): void => {
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
};

export const buildIndexJson = (projects: Project[]): ProjectIndexItem[] => {
  return projects
    .filter((p) => p.status === 'published')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const cover = p.assets.find((a) => a.id === p.coverAssetId) || p.assets[0];
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        client: p.client,
        year: p.year,
        category: p.category,
        summary: p.summary,
        featured: p.featured,
        sortOrder: p.sortOrder,
        coverAsset: cover
          ? {
              url: cover.url,
              thumbUrl: cover.thumbUrl || cover.url,
              width: cover.width,
              height: cover.height,
              alt: cover.alt || p.title,
              type: cover.type,
            }
          : undefined,
        updatedAt: p.updatedAt,
      };
    });
};

/**
 * Generate a client-side WebP thumbnail from an Image file using HTML5 Canvas.
 */
export const generateImageThumbnail = (
  file: File,
  maxWidth = 600
): Promise<{ thumbDataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const targetWidth = Math.min(img.width, maxWidth);
        const targetHeight = Math.round(targetWidth / aspect);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ thumbDataUrl: img.src, width: img.width, height: img.height });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const thumbDataUrl = canvas.toDataURL('image/webp', 0.85);
        resolve({ thumbDataUrl, width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract a video poster frame at second 1 using HTML5 video and canvas.
 */
export const extractVideoPoster = (
  file: File
): Promise<{ posterDataUrl: string; width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    video.onloadedmetadata = () => {
      // Seek to either 1s or half duration
      const seekTime = Math.min(1.0, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const posterDataUrl = canvas.toDataURL('image/webp', 0.85);
        URL.revokeObjectURL(fileUrl);
        resolve({
          posterDataUrl,
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      } else {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Failed creating canvas context'));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Failed reading video file'));
    };
  });
};

/**
 * Check admin session
 */
export const isAdminAuthenticated = (): boolean => {
  return localStorage.getItem(STORAGE_KEY_ADMIN_TOKEN) === 'authorized_session_valid';
};

export const setAdminAuthenticated = (isAuth: boolean): void => {
  if (isAuth) {
    localStorage.setItem(STORAGE_KEY_ADMIN_TOKEN, 'authorized_session_valid');
  } else {
    localStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
  }
};
