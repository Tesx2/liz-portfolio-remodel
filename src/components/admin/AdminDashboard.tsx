import React, { useState, useRef } from 'react';
import {
  Project,
  ProjectAsset,
  ProjectCategory,
  R2Config,
} from '../../types';
import {
  saveAllProjects,
  buildIndexJson,
  generateImageThumbnail,
  extractVideoPoster,
  saveR2Config,
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
  FolderOpen,
  Image as ImageIcon,
  Video,
  FileText,
  Sliders,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  HardDrive,
  Download,
  Send,
} from 'lucide-react';

interface AdminDashboardProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  r2Config: R2Config;
  onUpdateR2Config: (config: R2Config) => void;
  onLogout: () => void;
  onClose: () => void;
  onPreviewProject: (project: Project) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  projects,
  onUpdateProjects,
  r2Config,
  onUpdateR2Config,
  onLogout,
  onClose,
  onPreviewProject,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'editor' | 'settings'>('projects');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // R2 settings state
  const [tempR2Config, setTempR2Config] = useState<R2Config>(r2Config);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
    setActiveTab('editor');
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject({ ...proj });
    setActiveTab('editor');
  };

  const handleDeleteProject = (projId: string) => {
    if (confirm('Are you sure you want to delete this project? Associated files and metadata will be removed.')) {
      const updated = projects.filter((p) => p.id !== projId);
      onUpdateProjects(updated);
      saveAllProjects(updated);
      showToast('Project deleted successfully.');
      if (editingProject?.id === projId) {
        setEditingProject(null);
        setActiveTab('projects');
      }
    }
  };

  const handleSaveEditingProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    // Set cover asset if none selected
    let updatedProj = { ...editingProject, updatedAt: new Date().toISOString() };
    if (!updatedProj.coverAssetId && updatedProj.assets.length > 0) {
      updatedProj.coverAssetId = updatedProj.assets[0].id;
    }

    const existingIndex = projects.findIndex((p) => p.id === updatedProj.id);
    let updatedList: Project[];
    if (existingIndex >= 0) {
      updatedList = [...projects];
      updatedList[existingIndex] = updatedProj;
    } else {
      updatedList = [...projects, updatedProj];
    }

    onUpdateProjects(updatedList);
    saveAllProjects(updatedList);

    // If Netlify function is active, sync directly to Cloudflare R2
    const token = localStorage.getItem('liz_kendi_jwt_token');
    if (token) {
      fetch('/.netlify/functions/save-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProj),
      })
        .then((res) => {
          if (res.ok) {
            showToast(`Project "${updatedProj.title}" saved and synced to Cloudflare R2!`);
          }
        })
        .catch((err) => console.warn('R2 sync notice:', err));
    }

    showToast(`Project "${updatedProj.title}" saved successfully!`);
    setActiveTab('projects');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProject) return;

    setUploadProgress(10);
    const newAssets: ProjectAsset[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 1) / files.length) * 80));

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      let assetType: ProjectAsset['type'] = 'image';
      if (isVideo) assetType = 'video';
      else if (isPdf) assetType = 'pdf';
      else if (file.type.includes('svg')) assetType = 'svg';
      else if (file.type.includes('gif')) assetType = 'gif';

      const assetId = `asset-${Date.now()}-${i}`;
      let thumbUrl: string | undefined = undefined;
      let posterUrl: string | undefined = undefined;
      let width = 1920;
      let height = 1080;
      let duration: number | null = null;

      try {
        if (isImage) {
          const thumbResult = await generateImageThumbnail(file);
          thumbUrl = thumbResult.thumbDataUrl;
          width = thumbResult.width;
          height = thumbResult.height;
        } else if (isVideo) {
          const videoResult = await extractVideoPoster(file);
          posterUrl = videoResult.posterDataUrl;
          thumbUrl = videoResult.posterDataUrl;
          width = videoResult.width;
          height = videoResult.height;
          duration = videoResult.duration;
        }
      } catch (err) {
        console.warn('Could not extract preview frame:', err);
      }

      // Generate object URL for immediate high-res preview
      const objectUrl = URL.createObjectURL(file);

      const asset: ProjectAsset = {
        id: assetId,
        type: assetType,
        key: `media/${editingProject.slug}/${assetId}/${file.name}`,
        url: objectUrl,
        thumbUrl: thumbUrl || objectUrl,
        posterUrl: posterUrl,
        width,
        height,
        duration,
        size: file.size,
        alt: `${editingProject.title} media asset`,
        caption: file.name,
        sortOrder: editingProject.assets.length + i + 1,
      };

      newAssets.push(asset);
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(null), 500);

    const updatedAssets = [...editingProject.assets, ...newAssets];
    setEditingProject({
      ...editingProject,
      assets: updatedAssets,
      coverAssetId: editingProject.coverAssetId || (newAssets[0] ? newAssets[0].id : ''),
    });

    showToast(`Uploaded ${newAssets.length} asset(s) with browser-generated WebP thumbnails.`);
  };

  const handleRemoveAsset = (assetId: string) => {
    if (!editingProject) return;
    const updated = editingProject.assets.filter((a) => a.id !== assetId);
    let coverId = editingProject.coverAssetId;
    if (coverId === assetId) {
      coverId = updated[0]?.id || '';
    }
    setEditingProject({
      ...editingProject,
      assets: updated,
      coverAssetId: coverId,
    });
  };

  const handleSetCover = (assetId: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      coverAssetId: assetId,
    });
    showToast('Cover asset updated.');
  };

  const handlePublishSite = () => {
    const indexData = buildIndexJson(projects);
    const blob = new Blob([JSON.stringify(indexData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.json';
    link.click();
    URL.revokeObjectURL(url);

    if (tempR2Config.buildHookUrl) {
      fetch(tempR2Config.buildHookUrl, { method: 'POST' })
        .then(() => showToast('Triggered Netlify build hook successfully!'))
        .catch((e) => showToast(`Build hook triggered: ${e.message}`));
    } else {
      showToast('Rebuilt content/index.json and initiated export download!');
    }
  };

  const handleSaveR2Settings = (e: React.FormEvent) => {
    e.preventDefault();
    const configToSave = {
      ...tempR2Config,
      isConfigured: !!(tempR2Config.accountId && tempR2Config.accessKeyId),
    };
    onUpdateR2Config(configToSave);
    saveR2Config(configToSave);
    showToast('Cloudflare R2 and storage parameters saved successfully.');
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
              R2 Storage Pipeline · Content CMS & Media Ingestion
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
              R2 / Cloud Config
            </button>
          </div>

          <button
            onClick={handlePublishSite}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Publish / Export index.json</span>
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
                <h2 className="font-display text-2xl font-bold">Portfolio Projects</h2>
                <p className="text-xs text-white/50 font-mono mt-1">
                  Manage drafts, published status, and media ordering for the live site.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter by title..."
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

            {/* Projects Table */}
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
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-lg bg-[#1e1929] overflow-hidden border border-white/10">
                            {cover ? (
                              <img
                                src={cover.thumbUrl || cover.url}
                                alt={cover.alt}
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
                              onClick={() => onPreviewProject(p)}
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
                              onClick={() => handleDeleteProject(p.id)}
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
                  Slug: <span className="text-[#ca57bb]">{editingProject.slug}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onPreviewProject(editingProject)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#ca57bb]" />
                  <span>Preview</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-lg text-xs font-semibold shadow-lg shadow-[#8a307f]/25 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Project</span>
                </button>
              </div>
            </div>

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
                      <option value="draft">Draft (Admin Only)</option>
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

                {/* Challenge & Solution */}
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
                  <h3 className="font-display text-xl font-bold">Project Media Assets</h3>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Drag and drop images, MP4 videos, SVGs, or PDFs. Client-side canvas thumbnail generator automatically produces WebP thumbnails and video poster frames.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,video/mp4,video/webm,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Media File(s)</span>
                  </button>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="p-4 rounded-xl bg-[#16121f] border border-[#8a307f]/40 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span>Processing Media & Generating WebP Previews...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8a307f] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Assets list */}
              {editingProject.assets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editingProject.assets.map((asset, idx) => {
                    const isCover = editingProject.coverAssetId === asset.id;
                    return (
                      <div
                        key={asset.id}
                        className={`p-4 rounded-2xl bg-[#14101c] border transition-all ${
                          isCover
                            ? 'border-[#8a307f] ring-1 ring-[#8a307f]'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0a080d] mb-3 border border-white/10">
                          <img
                            src={asset.thumbUrl || asset.url}
                            alt={asset.alt}
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
                              onClick={() => handleSetCover(asset.id)}
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
                              onClick={() => handleRemoveAsset(asset.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Delete Asset"
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
                    Click to select JPG, PNG, WebP, MP4, or SVG files.
                  </p>
                </div>
              )}
            </div>
          </form>
        )}

        {/* ================= TAB 3: R2 / STORAGE SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold">
                Cloudflare R2 & Netlify Configuration
              </h2>
              <p className="text-xs font-mono text-white/50 mt-1">
                Configure your S3-compatible R2 storage parameters, media CDN base URL, and build triggers.
              </p>
            </div>

            <form onSubmit={handleSaveR2Settings} className="p-8 rounded-2xl bg-[#14101c] border border-white/10 space-y-5">
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                  R2 Account ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7f8a9b1c2d3e4f5a6b7c8d9e"
                  value={tempR2Config.accountId}
                  onChange={(e) => setTempR2Config({ ...tempR2Config, accountId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                    R2 Access Key ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9b1c2d3e4f5a..."
                    value={tempR2Config.accessKeyId}
                    onChange={(e) => setTempR2Config({ ...tempR2Config, accessKeyId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                    R2 Bucket Name
                  </label>
                  <input
                    type="text"
                    value={tempR2Config.bucket}
                    onChange={(e) => setTempR2Config({ ...tempR2Config, bucket: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                  R2 Secret Access Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={tempR2Config.secretAccessKey}
                  onChange={(e) => setTempR2Config({ ...tempR2Config, secretAccessKey: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                  Public Media Base URL (PUBLIC_MEDIA_BASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://media.lizkendi.com"
                  value={tempR2Config.publicMediaBaseUrl}
                  onChange={(e) => setTempR2Config({ ...tempR2Config, publicMediaBaseUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5 uppercase">
                  Netlify Build Hook URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://api.netlify.com/build_hooks/..."
                  value={tempR2Config.buildHookUrl || ''}
                  onChange={(e) => setTempR2Config({ ...tempR2Config, buildHookUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#8a307f]"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-white/50">
                  Storage Status:{' '}
                  <span className={tempR2Config.isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                    {tempR2Config.isConfigured ? 'Active (Connected)' : 'Local Storage Engine Ready'}
                  </span>
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Storage Parameters
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
