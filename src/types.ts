export type ProjectCategory = 'branding' | 'motion' | 'poster' | 'social' | 'other';

export type AssetType = 'image' | 'video' | 'gif' | 'lottie' | 'svg' | 'pdf' | 'audio';

export interface ProjectAsset {
  id: string;
  type: AssetType;
  key: string;
  thumbKey?: string | null;
  posterKey?: string | null;
  previewKey?: string | null;
  url?: string;
  thumbUrl?: string | null;
  posterUrl?: string | null;
  previewUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  size?: number | null;
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
    key: string;
    thumbKey?: string | null;
    url?: string;
    thumbUrl?: string;
    width?: number | null;
    height?: number | null;
    alt: string;
    type: AssetType;
  } | null;
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

export interface PublicMediaSettings {
  publicMediaBaseUrl: string;
}
