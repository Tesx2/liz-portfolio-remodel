export type ProjectCategory = 'branding' | 'motion' | 'poster' | 'social' | 'other';

export type AssetType = 'image' | 'video' | 'gif' | 'lottie' | 'svg' | 'pdf' | 'audio';

export interface ProjectAsset {
  id: string;
  type: AssetType;
  key: string;
  url: string;
  thumbKey?: string | null;
  thumbUrl?: string | null;
  posterKey?: string | null;
  posterUrl?: string | null;
  previewKey?: string | null;
  previewUrl?: string | null;
  width?: number;
  height?: number;
  duration?: number | null;
  size?: number;
  alt: string;
  caption?: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  client: string;
  year: number;
  role: string;
  category: ProjectCategory;
  summary: string;
  description: string;
  status: 'draft' | 'published';
  featured: boolean;
  sortOrder: number;
  coverAssetId: string;
  assets: ProjectAsset[];
  createdAt: string;
  updatedAt: string;
  // Case study specific details
  challenge?: string;
  solution?: string;
  deliverables?: string[];
  toolsUsed?: string[];
  liveUrl?: string;
}

export interface ProjectIndexItem {
  id: string;
  slug: string;
  title: string;
  client: string;
  year: number;
  category: ProjectCategory;
  summary: string;
  featured: boolean;
  sortOrder: number;
  coverAsset?: {
    url: string;
    thumbUrl?: string;
    width?: number;
    height?: number;
    alt: string;
    type: AssetType;
  };
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  role: string;
  company: string;
  project: string;
  location: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  category: string;
  description: string;
  deliverables: string[];
  timeline: string;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicMediaBaseUrl: string;
  buildHookUrl?: string;
  isConfigured: boolean;
}
