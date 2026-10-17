import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectAsset, ProjectCategory } from '../../types';
import {
  fetchAdminProjectsList,
  saveProjectToR2,
  deleteProjectFromR2,
  deleteAssetFromR2,
  triggerProductionBuild,
  uploadFileDirectToR2,
  uploadFileMultipartToR2,
  generateImageThumbnailBlob,
  extractVideoPosterBlob,
  getMediaAssetUrl,
  getPublicMediaBaseUrl,
  savePublicMediaBaseUrl,
} from '../../services/storageService';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  LogOut,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Download,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface FileUploadTask {
  id: string;
  file: File;
  fileName: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  asset?: ProjectAsset;
}

interface AdminDashboardProps {
  onLogout: () => void;
  onClose: () => void;
  onPreviewProject: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onClose,
  onPreviewProject,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'editor' | 'settings'>('projects');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload tasks tracking
  const [uploadTasks, setUploadTasks] = useState<FileUploadTask[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Non-secret settings
  const [publicMediaUrlInput, setPublicMediaUrlInput] = useState<string>(getPublicMediaBaseUrl());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const data = await fetchAdminProjectsList();
      setProjects(data);
    } catch (err: any) {
      showToast(err.message || 'Failed loading projects from Cloudflare R2');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const hasActiveUploads = uploadTasks.some(
    (t) => t.status === 'uploading' || t.status === 'pending'
  );

  const handleCreateNewProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      slug: 'new-creative-project',
      title: 'New Creative Project',
      client: 'Independent Client',
      year: new Date().getFullYear(),
      role: 'Art Direction & Motion Graphics',
      category: 'branding',
      summary: 'Summary description for the new project.',
      description: 'Detailed project description and creative case study narrative.',
      status: 'draft',
      featured: false,
      sortOrder: projects.length + 1,
      coverAssetId: '',
      assets: [],
      deliverables: ['Brand Identity', '3D Motion Assets'],
      toolsUsed: ['Cinema 4D', 'After Effects', 'Illustrator'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingProject(newProj);
    setUploadTasks([]);
    setSaveError(null);
    setActiveTab('editor');
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject({ ...proj });
    setUploadTasks([]);
    setSaveError(null);
    setActiveTab('editor');
  };

  const handleDeleteProject = async (slug: string) => {
    if (
      !confirm(
        `Are you sure you want to delete project "${slug}"? This permanently removes all associated objects from Cloudflare R2.`
      )
    ) {
      return;
    }

    try {
      await deleteProjectFromR2(slug);
      showToast(`Project "${slug}" and R2 media objects deleted.`);
      loadProjects();
      if (editingProject?.slug === slug) {
        setEditingProject(null);
        setActiveTab('projects');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed deleting project from R2');
    }
  };

  const handleSaveEditingProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (hasActiveUploads) {
      alert('Please wait for all media file uploads to finish before saving the project.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    let updatedProj = { ...editingProject, updatedAt: new Date().toISOString() };
    if (!updatedProj.coverAssetId && updatedProj.assets.length > 0) {
      updatedProj.coverAssetId = updatedProj.assets[0].id;
    }

    try {
      const res = await saveProjectToR2(updatedProj);
      showToast(`Project "${updatedProj.title}" saved to Cloudflare R2.`);
      setIsSaving(false);
      setEditingProject(res.project);
      loadProjects();
      setActiveTab('projects');
    } catch (err: any) {
      setIsSaving(false);
      setSaveError(err.message || 'Failed saving project to R2');
      showToast('Save failed. Project form data has been preserved.');
    }
  };

  const processSingleFile = async (
    file: File,
    taskId: string,
    currentProj: Project
  ): Promise<ProjectAsset | null> => {
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';
    const isSvg = file.type.includes('svg');
    const isGif = file.type.includes('gif');

    let assetType: ProjectAsset['type'] = 'image';
    if (isVideo) assetType = 'video';
    else if (isPdf) assetType = 'pdf';
    else if (isSvg) assetType = 'svg';
    else if (isGif) assetType = 'gif';

    const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const updateProgress = (pct: number) => {
      setUploadTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, progress: pct } : t))
      );
    };

    try {
      let width: number | null = null;
      let height: number | null = null;
      let duration: number | null = null;
      let thumbKey: string | null = null;
      let posterKey: string | null = null;
      let previewUrl: string = '';

      // Generate and upload WebP thumbnail for images
      if (assetType === 'image' || isGif) {
        try {
          const thumbRes = await generateImageThumbnailBlob(file);
          width = thumbRes.width;
          height = thumbRes.height;
          previewUrl = thumbRes.previewUrl;

          const thumbUpload = await uploadFileDirectToR2(
            thumbRes.blob,
            {
              projectSlug: currentProj.slug,
              assetId,
              fileName: 'thumb.webp',
              contentType: 'image/webp',
              variant: 'thumb',
            }
          );
          thumbKey = thumbUpload.key;
        } catch (thumbErr) {
          console.warn('Thumbnail generation warning:', thumbErr);
        }
      }

      // Generate poster frame for videos
      if (isVideo) {
        try {
          const posterRes = await extractVideoPosterBlob(file);
          width = posterRes.width;
          height = posterRes.height;
          duration = posterRes.duration;
          previewUrl = posterRes.previewUrl;

          const posterUpload = await uploadFileDirectToR2(
            posterRes.blob,
            {
              projectSlug: currentProj.slug,
              assetId,
              fileName: 'poster.webp',
              contentType: 'image/webp',
              variant: 'poster',
            }
          );
          posterKey = posterUpload.key;
          thumbKey = posterKey;
        } catch (posterErr) {
          console.warn('Poster extraction warning:', posterErr);
        }
      }

      // Upload original file: Single-part (<= 50MB) or Multipart (> 50MB up to 2GB)
      const FIFTY_MB = 50 * 1024 * 1024;
      let uploadResultKey = '';

      if (file.size <= FIFTY_MB) {
        const uploadRes = await uploadFileDirectToR2(
          file,
          {
            projectSlug: currentProj.slug,
            assetId,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            variant: 'original',
          },
          updateProgress
        );
        uploadResultKey = uploadRes.key;
      } else {
        const uploadRes = await uploadFileMultipartToR2(
          file,
          {
            projectSlug: currentProj.slug,
            assetId,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
          },
          updateProgress
        );
        uploadResultKey = uploadRes.key;
      }

      const completedAsset: ProjectAsset = {
        id: assetId,
        type: assetType,
        key: uploadResultKey,
        thumbKey: thumbKey || uploadResultKey,
        posterKey: posterKey,
        previewUrl: previewUrl || URL.createObjectURL(file), // temporary local preview
        width,
        height,
        duration,
        size: file.size,
        alt: `${currentProj.title} visual asset`,
        caption: file.name,
        sortOrder: (currentProj.assets?.length || 0) + 1,
      };

      setUploadTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'completed', progress: 100, asset: completedAsset }
            : t
        )
      );

      return completedAsset;
    } catch (err: any) {
      setUploadTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'failed', errorMessage: err.message || 'Upload failed' }
            : t
        )
      );
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProject) return;

    const newTasks: FileUploadTask[] = Array.from(files).map((file, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      file,
      fileName: file.name,
      status: 'pending',
      progress: 0,
    }));

    setUploadTasks((prev) => [...prev, ...newTasks]);

    // Process files sequentially or in small queue
    for (const task of newTasks) {
      setUploadTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading' } : t))
      );

      const createdAsset = await processSingleFile(task.file, task.id, editingProject);
      if (createdAsset) {
        setEditingProject((prevProj) => {
          if (!prevProj) return prevProj;
          const updatedAssets = [...(prevProj.assets || []), createdAsset];
          return {
            ...prevProj,
            assets: updatedAssets,
            coverAssetId: prevProj.coverAssetId || createdAsset.id,
          };
        });
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRetryUpload = async (task: FileUploadTask) => {
    if (!editingProject) return;
    setUploadTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: 'uploading', progress: 0, errorMessage: undefined }
          : t
      )
    );

    const createdAsset = await processSingleFile(task.file, task.id, editingProject);
    if (createdAsset) {
      setEditingProject((prevProj) => {
        if (!prevProj) return prevProj;
        return {
          ...prevProj,
          assets: [...(prevProj.assets || []), createdAsset],
          coverAssetId: prevProj.coverAssetId || createdAsset.id,
        };
      });
    }
  };

  const handleRemoveAsset = async (asset: ProjectAsset) => {
    if (!editingProject) return;
    if (confirm('Delete this asset from R2?')) {
      const keysToDelete = [asset.key];
      if (asset.thumbKey && asset.thumbKey !== asset.key) keysToDelete.push(asset.thumbKey);
      if (asset.posterKey) keysToDelete.push(asset.posterKey);

      try {
        await deleteAssetFromR2(keysToDelete);
        const updated = editingProject.assets.filter((a) => a.id !== asset.id);
        let coverId = editingProject.coverAssetId;
        if (coverId === asset.id) {
          coverId = updated[0]?.id || '';
        }
        setEditingProject({
          ...editingProject,
          assets: updated,
          coverAssetId: coverId,
        });
        showToast('Asset removed from project and R2.');
      } catch (err: any) {
        showToast(err.message || 'Failed deleting asset from R2');
      }
    }
  };

  const handlePublishSite = async () => {
    try {
      await triggerProductionBuild();
      showToast('Triggered Netlify production deploy via build hook!');
    } catch (err: any) {
      showToast(err.message || 'Failed triggering publish build hook');
    }
  };

  const handleSavePublicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    savePublicMediaBaseUrl(publicMediaUrlInput);
    showToast('Public Media CDN Base URL saved.');
  };

  const filteredProjects = projects.filter((p) => {
    const matchesCat = filterCategory === 'all' || p.category === filterCategory;
    const matchesQ =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a080e] text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#8a307f] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#120f18]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#8a307f]/20 border border-[#8a307f] text-[#ca57bb]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold">Liz Kendi Portfolio Administration</h1>
            <p className="text-[11px] font-mono text-white/50">
              Cloudflare R2 Direct Pipeline · Cookie-Authenticated CMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#1a1524] rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[#8a307f] text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => {
                if (!editingProject && projects.length > 0) {
                  setEditingProject(projects[0]);
                }
                setActiveTab('editor');
              }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-[#8a307f] text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Project Editor
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#8a307f] text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Media CDN Settings
            </button>
          </div>

          <button
            onClick={handlePublishSite}
            title="Triggers Netlify Build Hook for production pre-render"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Publish Site</span>
          </button>

          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ================= TAB 1: PROJECTS LIST ================= */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">R2 Portfolio Projects</h2>
                <p className="text-xs text-white/50 font-mono mt-1">
                  Source of truth stored in Cloudflare R2: <code className="text-[#ca57bb]">content/projects/*.json</code>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter by title or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
                />
                <button
                  onClick={handleCreateNewProject}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {isLoadingProjects ? (
              <div className="py-20 text-center text-white/50 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#ca57bb]" />
                <span className="text-xs font-mono">Loading projects directly from Cloudflare R2...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-white/10 bg-[#120f18] space-y-3">
                <p className="text-sm text-white/70">No projects currently found in Cloudflare R2 bucket.</p>
                <button
                  onClick={handleCreateNewProject}
                  className="px-4 py-2 bg-[#8a307f] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#120f18]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#191522] text-white/50 border-b border-white/10 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Cover</th>
                      <th className="py-3 px-4">Title & Client</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assets</th>
                      <th className="py-3 px-4">Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredProjects.map((p) => {
                      const cover = p.assets.find((a) => a.id === p.coverAssetId) || p.assets[0];
                      const coverUrl = cover
                        ? getMediaAssetUrl(cover.thumbKey || cover.key)
                        : '';
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="w-12 h-12 rounded-lg bg-[#1e1929] overflow-hidden border border-white/10">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={cover?.alt || p.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white font-sans font-semibold text-sm">
                              {p.title}
                            </div>
                            <div className="text-white/50 text-[11px]">{p.client} · {p.year}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[#ca57bb] uppercase text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                p.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            {p.assets.length} file{p.assets.length === 1 ? '' : 's'}
                          </td>
                          <td className="py-3 px-4 text-white/40 text-[11px]">
                            {new Date(p.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onPreviewProject(p.slug)}
                                title="Live Preview"
                                className="p-1.5 rounded bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditProject(p)}
                                title="Edit Project"
                                className="p-1.5 rounded bg-[#8a307f]/20 hover:bg-[#8a307f]/40 text-[#ca57bb]"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(p.slug)}
                                title="Delete Project"
                                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PROJECT EDITOR ================= */}
        {activeTab === 'editor' && editingProject && (
          <form onSubmit={handleSaveEditingProject} className="space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Editing: {editingProject.title}
                </h2>
                <p className="text-xs font-mono text-white/50">
                  Slug: <span className="text-[#ca57bb]">{editingProject.slug}</span> · Key:{' '}
                  <code>content/projects/{editingProject.slug}.json</code>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onPreviewProject(editingProject.slug)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#ca57bb]" />
                  <span>Preview</span>
                </button>
                <button
                  type="submit"
                  disabled={hasActiveUploads || isSaving}
                  className={`flex items-center gap-2 px-5 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-lg text-xs font-semibold shadow-lg shadow-[#8a307f]/25 cursor-pointer ${
                    hasActiveUploads || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {hasActiveUploads
                      ? 'Uploads In Progress...'
                      : isSaving
                      ? 'Saving to R2...'
                      : 'Save Project'}
                  </span>
                </button>
              </div>
            </div>

            {saveError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Error saving project: {saveError}. Form changes have been kept.</span>
              </div>
            )}

            {/* Core Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5 uppercase">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        title: e.target.value,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, ''),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#14101c] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#8a307f]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1.5 uppercase">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={editingProject.client}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, client: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1.5 uppercase">
                      Year
                    </label>
                    <input
                      type="number"
                      value={editingProject.year}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          year: parseInt(e.target.value) || 2026,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5 uppercase">
                    Role & Discipline
                  </label>
                  <input
                    type="text"
                    value={editingProject.role}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, role: e.target.value })
                    }
                    placeholder="e.g. Brand Identity, 3D Motion Graphics"
                    className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5 uppercase">
                    One-Line Teaser Summary
                  </label>
                  <input
                    type="text"
                    value={editingProject.summary}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, summary: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5 uppercase">
                    Case Study Story Description (Markdown)
                  </label>
                  <textarea
                    rows={6}
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Sidebar controls */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#130f1a] border border-white/10 space-y-4">
                  <h3 className="text-xs font-mono uppercase text-white/50 tracking-wider">
                    Status & Flags
                  </h3>

                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Publication Status
                    </label>
                    <select
                      value={editingProject.status}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          status: e.target.value as 'draft' | 'published',
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    >
                      <option value="draft">Draft (Excluded from index.json)</option>
                      <option value="published">Published (Live On Site)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Category
                    </label>
                    <select
                      value={editingProject.category}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          category: e.target.value as ProjectCategory,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    >
                      <option value="branding">Brand Identity</option>
                      <option value="motion">Motion & 3D</option>
                      <option value="poster">Poster & Print</option>
                      <option value="social">Digital Campaign</option>
                      <option value="other">Other Design</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-mono text-white/70">Featured on Home</span>
                    <input
                      type="checkbox"
                      checked={editingProject.featured}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, featured: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#8a307f] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Sort Order Weight
                    </label>
                    <input
                      type="number"
                      value={editingProject.sortOrder}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          sortOrder: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#130f1a] border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono uppercase text-white/50 tracking-wider">
                    Creative Brief Details
                  </h3>
                  <div>
                    <label className="block text-[11px] font-mono text-white/60 mb-1">
                      The Challenge
                    </label>
                    <textarea
                      rows={2}
                      value={editingProject.challenge || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, challenge: e.target.value })
                      }
                      className="w-full p-2 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-white/60 mb-1">
                      The Solution
                    </label>
                    <textarea
                      rows={2}
                      value={editingProject.solution || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, solution: e.target.value })
                      }
                      className="w-full p-2 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Upload & Assets Management */}
            <div className="pt-6 border-t border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold">R2 Direct Media Pipeline</h3>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Browser uploads directly to Cloudflare R2 via presigned URLs. Files &gt;50 MB use 10 MB multipart chunks (up to 2 GB).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload to R2</span>
                  </button>
                </div>
              </div>

              {/* Per-file Upload Tasks with Progress & Retry */}
              {uploadTasks.length > 0 && (
                <div className="p-4 rounded-xl bg-[#16121f] border border-white/10 space-y-3">
                  <span className="text-xs font-mono uppercase text-white/50 tracking-wider">
                    Upload Activity
                  </span>
                  <div className="space-y-2">
                    {uploadTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono flex items-center justify-between gap-4"
                      >
                        <div className="truncate max-w-xs sm:max-w-md">
                          <span className="text-white block truncate">{t.fileName}</span>
                          {t.errorMessage && (
                            <span className="text-red-400 text-[11px] block">{t.errorMessage}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {t.status === 'uploading' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#ca57bb]">{t.progress}%</span>
                              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#8a307f] transition-all duration-200"
                                  style={{ width: `${t.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {t.status === 'completed' && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Uploaded to R2</span>
                            </span>
                          )}
                          {t.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryUpload(t)}
                              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stored Assets (rendered via <img> only) */}
              {editingProject.assets && editingProject.assets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editingProject.assets.map((asset, idx) => {
                    const isCover = editingProject.coverAssetId === asset.id;
                    const previewSrc =
                      asset.previewUrl || getMediaAssetUrl(asset.thumbKey || asset.key);

                    return (
                      <div
                        key={asset.id}
                        className={`p-4 rounded-2xl bg-[#14101c] border transition-all ${
                          isCover
                            ? 'border-[#8a307f] ring-1 ring-[#8a307f]'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Render ONLY through <img> tag (never inline SVG) */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0a080d] mb-3 border border-white/10">
                          <img
                            src={previewSrc}
                            alt={asset.alt || 'Asset'}
                            className="w-full h-full object-cover"
                          />
                          {isCover && (
                            <span className="absolute top-2 left-2 text-[10px] font-mono tracking-wider bg-[#8a307f] text-white px-2 py-0.5 rounded font-semibold">
                              COVER ASSET
                            </span>
                          )}
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 text-white px-2 py-0.5 rounded">
                            {asset.type.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] font-mono text-white/50 truncate">
                            R2 Key: {asset.key}
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-white/50 uppercase">
                              Alt Text (Accessibility)
                            </label>
                            <input
                              type="text"
                              value={asset.alt}
                              onChange={(e) => {
                                const updatedAssets = [...editingProject.assets];
                                updatedAssets[idx].alt = e.target.value;
                                setEditingProject({ ...editingProject, assets: updatedAssets });
                              }}
                              className="w-full px-2 py-1 bg-[#0b0811] border border-white/10 rounded text-white text-xs mt-0.5"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  coverAssetId: asset.id,
                                })
                              }
                              disabled={isCover}
                              className={`text-[11px] font-mono ${
                                isCover
                                  ? 'text-[#ca57bb] font-semibold'
                                  : 'text-white/60 hover:text-white cursor-pointer'
                              }`}
                            >
                              {isCover ? '✓ Main Cover' : 'Set as Cover'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAsset(asset)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Delete Asset from R2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-14 text-center rounded-2xl border-2 border-dashed border-white/15 hover:border-[#8a307f] bg-[#120f18]/40 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-10 h-10 text-white/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/80">
                    No media assets uploaded yet for this project.
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Click to upload JPG, PNG, WebP, MP4, or SVG directly to Cloudflare R2.
                  </p>
                </div>
              )}
            </div>
          </form>
        )}

        {/* ================= TAB 3: NON-SECRET MEDIA CDN SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Public Media CDN Configuration</h2>
              <p className="text-xs font-mono text-white/50 mt-1">
                Configure your public media delivery domain. All S3/R2 access credentials reside securely on the server in Netlify environment variables.
              </p>
            </div>

            <form
              onSubmit={handleSavePublicSettings}
              className="p-8 rounded-2xl bg-[#14101c] border border-white/10 space-y-5"
            >
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                  Public Media Base URL (PUBLIC_MEDIA_BASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://media.lizkendi.com"
                  value={publicMediaUrlInput}
                  onChange={(e) => setPublicMediaUrlInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                />
                <p className="text-[11px] font-mono text-white/40 mt-1.5">
                  The public CDN domain connected to your Cloudflare R2 bucket. Assets are fetched from{' '}
                  <code className="text-[#ca57bb]">&lt;PUBLIC_MEDIA_BASE_URL&gt;/media/...</code>
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400">
                  R2 Credentials Server-Protected
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Public Domain
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
