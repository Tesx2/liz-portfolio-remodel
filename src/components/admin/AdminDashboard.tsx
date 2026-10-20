import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectAsset, ProjectCategory, SiteContent } from '../../types';
import {
  fetchAdminProjectsList,
  saveProjectToR2,
  deleteProjectFromR2,
  deleteAssetFromR2,
  uploadFileDirectToR2,
  uploadFileMultipartToR2,
  generateImageThumbnailBlob,
  extractVideoPosterBlob,
  getMediaAssetUrl,
  fetchSiteContent,
  saveSiteContentToR2,
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
  Loader2,
  Film,
  User,
  Link as LinkIcon,
  Play,
} from 'lucide-react';
import lizPortraitFallback from '../../assets/images/liz_kendi_portrait_1792226932929.jpg';
import showreelFallback from '../../assets/images/liz_hero_showreel_poster_1792226915723.jpg';

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
  const [activeTab, setActiveTab] = useState<'projects' | 'site-content' | 'editor'>('projects');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Project deletion state
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Upload tasks tracking
  const [uploadTasks, setUploadTasks] = useState<FileUploadTask[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Site content state
  const [siteContent, setSiteContent] = useState<SiteContent>({
    portraitKey: null,
    showreelKey: null,
    showreelPosterKey: null,
    showreelLink: '',
    heroLoopKey: null,
    heroPosterKey: null,
  });
  const [isSavingSiteContent, setIsSavingSiteContent] = useState<boolean>(false);
  const [isUploadingPortrait, setIsUploadingPortrait] = useState<boolean>(false);
  const [isUploadingShowreel, setIsUploadingShowreel] = useState<boolean>(false);
  const [isUploadingHeroLoop, setIsUploadingHeroLoop] = useState<boolean>(false);
  const [isCapturingPoster, setIsCapturingPoster] = useState<boolean>(false);
  const [portraitPreview, setPortraitPreview] = useState<string>('');
  const [showreelPosterPreview, setShowreelPosterPreview] = useState<string>('');
  const [heroLoopBlobUrl, setHeroLoopBlobUrl] = useState<string>('');
  const [heroPosterPreview, setHeroPosterPreview] = useState<string>('');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTimeSlider, setCurrentTimeSlider] = useState<number>(0);
  const [pendingLargeShowreel, setPendingLargeShowreel] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const showreelInputRef = useRef<HTMLInputElement>(null);
  const heroLoopInputRef = useRef<HTMLInputElement>(null);
  const showreelLinkInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const RESERVED_SLUGS = ['site', 'content', 'media', 'admin', 'api', 'new', 'work'];

  const getSafeProjectSlug = (title: string): string => {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) slug = 'project';
    if (RESERVED_SLUGS.includes(slug)) {
      slug = `${slug}-project`;
    }
    return slug;
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
      showToast(err.message || 'Failed loading projects.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadSiteContent = async () => {
    try {
      const data = await fetchSiteContent();
      if (data) {
        setSiteContent(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadProjects();
    loadSiteContent();
  }, []);

  const hasActiveUploads = uploadTasks.some(
    (t) => t.status === 'uploading' || t.status === 'pending'
  );

  const handleCreateNewProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      slug: 'new-project',
      title: 'New Project',
      client: 'Client',
      year: new Date().getFullYear(),
      role: 'Graphic design and animation',
      category: 'branding',
      summary: 'Short summary of the project.',
      description: 'Project details and background.',
      status: 'draft',
      featured: false,
      sortOrder: projects.length + 1,
      coverAssetId: '',
      assets: [],
      deliverables: ['Brand identity', 'Animation'],
      toolsUsed: ['Illustrator', 'After Effects'],
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

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);

    try {
      await deleteProjectFromR2(projectToDelete);
      showToast('Project deleted.');
      setProjectToDelete(null);
      await loadProjects();
      if (editingProject?.slug === projectToDelete) {
        setEditingProject(null);
        setActiveTab('projects');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEditingProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (hasActiveUploads) {
      alert('Please wait for all uploads to complete before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    let cleanSlug = editingProject.slug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    if (RESERVED_SLUGS.includes(cleanSlug)) {
      cleanSlug = `${cleanSlug}-project`;
    }

    let updatedProj = { ...editingProject, slug: cleanSlug, updatedAt: new Date().toISOString() };
    if (!updatedProj.coverAssetId && updatedProj.assets.length > 0) {
      updatedProj.coverAssetId = updatedProj.assets[0].id;
    }

    try {
      const res = await saveProjectToR2(updatedProj);
      showToast('Saved.');
      setIsSaving(false);
      setEditingProject(res.project);
      await loadProjects();
      setActiveTab('projects');
    } catch (err: any) {
      setIsSaving(false);
      setSaveError(err.message || 'Could not save.');
      showToast('Could not save. Changes were kept.');
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
        } catch {
          // Fallback
        }
      }

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
        } catch {
          // Fallback
        }
      }

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
        previewUrl: previewUrl || URL.createObjectURL(file),
        width,
        height,
        duration,
        size: file.size,
        alt: `${currentProj.title} file`,
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
    if (confirm('Delete this file? This cannot be undone.')) {
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
        showToast('File deleted.');
      } catch (err: any) {
        showToast(err.message || 'Could not delete file.');
      }
    }
  };

  // --- Site Content Handlers ---
  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPortrait(true);
    try {
      const assetId = `portrait-${Date.now()}`;
      const uploadRes = await uploadFileDirectToR2(file, {
        projectSlug: 'site',
        assetId,
        fileName: file.name,
        contentType: file.type,
        variant: 'original',
      });
      setSiteContent((prev) => ({ ...prev, portraitKey: uploadRes.key }));
      setPortraitPreview(URL.createObjectURL(file));
      showToast('Photo uploaded.');
    } catch (err: any) {
      showToast(err.message || 'Photo upload failed.');
    } finally {
      setIsUploadingPortrait(false);
      if (portraitInputRef.current) portraitInputRef.current.value = '';
    }
  };

  const executeShowreelUpload = async (file: File) => {
    setIsUploadingShowreel(true);
    const localBlob = URL.createObjectURL(file);
    setVideoBlobUrl(localBlob);

    try {
      const assetId = `showreel-${Date.now()}`;
      const FIFTY_MB = 50 * 1024 * 1024;
      let uploadKey = '';

      if (file.size <= FIFTY_MB) {
        const uploadRes = await uploadFileDirectToR2(file, {
          projectSlug: 'site',
          assetId,
          fileName: file.name,
          contentType: file.type || 'video/mp4',
          variant: 'original',
        });
        uploadKey = uploadRes.key;
      } else {
        const uploadRes = await uploadFileMultipartToR2(file, {
          projectSlug: 'site',
          assetId,
          fileName: file.name,
          contentType: file.type || 'video/mp4',
        });
        uploadKey = uploadRes.key;
      }

      // Automatically generate initial poster
      try {
        const posterRes = await extractVideoPosterBlob(file);
        const posterUpload = await uploadFileDirectToR2(posterRes.blob, {
          projectSlug: 'site',
          assetId,
          fileName: 'poster.webp',
          contentType: 'image/webp',
          variant: 'poster',
        });
        setSiteContent((prev) => ({
          ...prev,
          showreelKey: uploadKey,
          showreelPosterKey: posterUpload.key,
        }));
        setShowreelPosterPreview(posterRes.previewUrl);
        setVideoDuration(posterRes.duration);
      } catch {
        setSiteContent((prev) => ({ ...prev, showreelKey: uploadKey }));
      }

      showToast('Showreel uploaded.');
    } catch (err: any) {
      showToast(err.message || 'Showreel upload failed.');
    } finally {
      setIsUploadingShowreel(false);
      if (showreelInputRef.current) showreelInputRef.current.value = '';
    }
  };

  const handleShowreelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const TWO_HUNDRED_MB = 200 * 1024 * 1024;
    const ONE_HUNDRED_MB = 100 * 1024 * 1024;

    if (file.size > TWO_HUNDRED_MB) {
      showToast('Showreel file exceeds 200 MB limit.');
      if (showreelInputRef.current) showreelInputRef.current.value = '';
      return;
    }

    if (file.size > ONE_HUNDRED_MB) {
      setPendingLargeShowreel(file);
      return;
    }

    executeShowreelUpload(file);
  };

  const handleHeroLoopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp4OrWebm =
      file.type === 'video/mp4' ||
      file.type === 'video/webm' ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.webm');

    if (!isMp4OrWebm) {
      showToast('Accepts MP4 or WebM only.');
      if (heroLoopInputRef.current) heroLoopInputRef.current.value = '';
      return;
    }

    const TWENTY_FIVE_MB = 25 * 1024 * 1024;
    if (file.size > TWENTY_FIVE_MB) {
      showToast('Maximum file size is 25 MB.');
      if (heroLoopInputRef.current) heroLoopInputRef.current.value = '';
      return;
    }

    setIsUploadingHeroLoop(true);
    try {
      const posterRes = await extractVideoPosterBlob(file);
      if (posterRes.duration > 20) {
        showToast('Use a loop of 20 seconds or less.');
        setIsUploadingHeroLoop(false);
        if (heroLoopInputRef.current) heroLoopInputRef.current.value = '';
        return;
      }

      const assetId = `hero-loop-${Date.now()}`;
      const loopUpload = await uploadFileDirectToR2(file, {
        projectSlug: 'site',
        assetId,
        fileName: file.name,
        contentType: file.type || 'video/mp4',
        variant: 'original',
      });

      const posterUpload = await uploadFileDirectToR2(posterRes.blob, {
        projectSlug: 'site',
        assetId,
        fileName: 'poster.webp',
        contentType: 'image/webp',
        variant: 'poster',
      });

      setSiteContent((prev) => ({
        ...prev,
        heroLoopKey: loopUpload.key,
        heroPosterKey: posterUpload.key,
      }));
      setHeroLoopBlobUrl(URL.createObjectURL(file));
      setHeroPosterPreview(posterRes.previewUrl);
      showToast('Hero background loop uploaded.');
    } catch (err: any) {
      showToast(err.message || 'Failed uploading hero loop.');
    } finally {
      setIsUploadingHeroLoop(false);
      if (heroLoopInputRef.current) heroLoopInputRef.current.value = '';
    }
  };

  // Slider frame picker for video poster
  const handleSeekFrame = (time: number) => {
    setCurrentTimeSlider(time);
    const video = videoPlayerRef.current;
    if (video) {
      video.currentTime = time;
    }
  };

  const captureFrameFromVideo = () => {
    const video = videoPlayerRef.current;
    if (!video) return;

    setIsCapturingPoster(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturingPoster(false);
      return;
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsCapturingPoster(false);
            return;
          }
          try {
            const assetId = `poster-${Date.now()}`;
            const posterUpload = await uploadFileDirectToR2(blob, {
              projectSlug: 'site',
              assetId,
              fileName: 'poster.webp',
              contentType: 'image/webp',
              variant: 'poster',
            });
            setSiteContent((prev) => ({
              ...prev,
              showreelPosterKey: posterUpload.key,
            }));
            setShowreelPosterPreview(URL.createObjectURL(blob));
            showToast('Poster frame updated.');
          } catch (err: any) {
            showToast(err.message || 'Could not save poster frame.');
          } finally {
            setIsCapturingPoster(false);
          }
        },
        'image/webp',
        0.85
      );
    } catch {
      setIsCapturingPoster(false);
      showToast('Could not capture frame.');
    }
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSiteContent(true);

    try {
      await saveSiteContentToR2(siteContent);
      setIsSavingSiteContent(false);
      showToast('Saved.');
    } catch (err: any) {
      setIsSavingSiteContent(false);
      showToast(err.message || 'Could not save site content.');
    }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a080d] text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#8a307f] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Delete project</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Delete this project and all its files? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteProject}
                className="min-h-[44px] px-5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer transition-colors flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Showreel Warning Dialog */}
      {pendingLargeShowreel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Large file warning</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              This file is large and will be slow on phones. Use a YouTube or Vimeo link instead?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setPendingLargeShowreel(null);
                  if (showreelInputRef.current) showreelInputRef.current.value = '';
                  showreelLinkInputRef.current?.scrollIntoView({ behavior: 'smooth' });
                  showreelLinkInputRef.current?.focus();
                }}
                className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Use a link
              </button>
              <button
                type="button"
                onClick={() => {
                  const fileToUpload = pendingLargeShowreel;
                  setPendingLargeShowreel(null);
                  executeShowreelUpload(fileToUpload);
                }}
                className="min-h-[44px] px-5 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-xs font-semibold text-white cursor-pointer transition-colors shadow-sm"
              >
                Upload anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#120f18] border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-base font-bold tracking-tight text-white">
            Liz Kendi, Admin
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center p-1 bg-[#1a1524] rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`min-h-[36px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[#8a307f] text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('site-content')}
              className={`min-h-[36px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'site-content'
                  ? 'bg-[#8a307f] text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Site content
            </button>
            {editingProject && (
              <button
                onClick={() => setActiveTab('editor')}
                className={`min-h-[36px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-[#8a307f] text-white font-medium'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Project editor
              </button>
            )}
          </div>

          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ================= TAB 1: PROJECTS LIST ================= */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">Projects</h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                />
                <button
                  onClick={handleCreateNewProject}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New project</span>
                </button>
              </div>
            </div>

            {isLoadingProjects ? (
              <div className="py-20 text-center text-white/50 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#ca57bb]" />
                <span className="text-xs font-mono">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-white/10 bg-[#120f18] space-y-4">
                <p className="text-sm text-white/70">No projects yet.</p>
                <button
                  onClick={handleCreateNewProject}
                  className="min-h-[44px] px-5 py-2 bg-[#8a307f] hover:bg-[#9e3992] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Create first project
                </button>
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (screens under 768px) */}
                <div className="md:hidden space-y-4">
                  {filteredProjects.map((p) => {
                    const cover = p.assets.find((a) => a.id === p.coverAssetId) || p.assets[0];
                    const coverUrl = cover
                      ? getMediaAssetUrl(cover.thumbKey || cover.key)
                      : '';
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-white/10 bg-[#120f18] flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg bg-[#1e1929] overflow-hidden border border-white/10 shrink-0">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={cover?.alt || p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-white truncate">{p.title}</h3>
                            <p className="text-xs text-white/50 truncate">{p.client} · {p.year}</p>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                p.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {p.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons on mobile: touch target at least 44px */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={() => handleEditProject(p)}
                            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[#8a307f] text-white text-xs font-semibold cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setProjectToDelete(p.slug)}
                            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table (screens 768px and up) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-[#120f18]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#191522] text-white/50 border-b border-white/10 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Cover</th>
                        <th className="py-3 px-4">Title & Client</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
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
                                {p.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onPreviewProject(p.slug)}
                                  title="Preview"
                                  className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditProject(p)}
                                  className="min-h-[36px] px-3 flex items-center gap-1 rounded bg-[#8a307f] hover:bg-[#9e3992] text-white font-sans font-medium text-xs cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setProjectToDelete(p.slug)}
                                  className="min-h-[36px] px-3 flex items-center gap-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-sans font-medium text-xs cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 2: SITE CONTENT ================= */}
        {activeTab === 'site-content' && (
          <form onSubmit={handleSaveSiteContent} className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-display text-2xl font-bold">Site content</h2>
              <button
                type="submit"
                disabled={isSavingSiteContent}
                className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSavingSiteContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>

            {/* 1. Portrait Photo */}
            <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <User className="w-4 h-4 text-[#ca57bb]" />
                <span>Portrait photo</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <img
                    src={
                      portraitPreview ||
                      (siteContent.portraitKey ? getMediaAssetUrl(siteContent.portraitKey) : lizPortraitFallback)
                    }
                    alt="Liz Kendi Portrait"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <input
                    type="file"
                    ref={portraitInputRef}
                    onChange={handlePortraitUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingPortrait}
                    onClick={() => portraitInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center gap-2"
                  >
                    {isUploadingPortrait && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isUploadingPortrait ? 'Uploading photo...' : 'Replace photo'}</span>
                  </button>
                  <p className="text-[11px] text-white/50">Upload a JPG, PNG or WebP image.</p>
                </div>
              </div>
            </div>

            {/* 2. Hero Background Loop */}
            <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Play className="w-4 h-4 text-[#ca57bb]" />
                <span>Hero background loop</span>
              </div>
              <p className="text-xs text-white/60">
                A short silent loop, about 10 to 15 seconds.
              </p>

              <div className="space-y-4">
                <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden bg-black/50 border border-white/10 relative">
                  {(siteContent.heroLoopKey || heroLoopBlobUrl) ? (
                    <video
                      src={heroLoopBlobUrl || (siteContent.heroLoopKey ? getMediaAssetUrl(siteContent.heroLoopKey) : '')}
                      poster={
                        heroPosterPreview ||
                        (siteContent.heroPosterKey ? getMediaAssetUrl(siteContent.heroPosterKey) : showreelFallback)
                      }
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={
                        heroPosterPreview ||
                        (siteContent.heroPosterKey ? getMediaAssetUrl(siteContent.heroPosterKey) : showreelFallback)
                      }
                      alt="Hero background loop preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={heroLoopInputRef}
                    onChange={handleHeroLoopUpload}
                    accept="video/mp4,video/webm"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingHeroLoop}
                    onClick={() => heroLoopInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    {isUploadingHeroLoop && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isUploadingHeroLoop ? 'Uploading loop...' : 'Replace loop'}</span>
                  </button>
                  <span className="text-[11px] text-white/50">MP4 or WebM only, max 25 MB, up to 20 seconds.</span>
                </div>
              </div>
            </div>

            {/* 3. Showreel Video */}
            <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-5">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Film className="w-4 h-4 text-[#ca57bb]" />
                <span>Showreel video</span>
              </div>

              <div className="space-y-4">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-white/10 relative">
                  {(siteContent.showreelKey || videoBlobUrl) ? (
                    <video
                      ref={videoPlayerRef}
                      src={videoBlobUrl || (siteContent.showreelKey ? getMediaAssetUrl(siteContent.showreelKey) : '')}
                      poster={
                        showreelPosterPreview ||
                        (siteContent.showreelPosterKey ? getMediaAssetUrl(siteContent.showreelPosterKey) : showreelFallback)
                      }
                      controls
                      playsInline
                      crossOrigin="anonymous"
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration;
                        if (dur && !isNaN(dur) && isFinite(dur)) {
                          setVideoDuration(dur);
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={showreelPosterPreview || showreelFallback}
                      alt="Showreel Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={showreelInputRef}
                    onChange={handleShowreelUpload}
                    accept="video/mp4,video/webm"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingShowreel}
                    onClick={() => showreelInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    {isUploadingShowreel && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isUploadingShowreel ? 'Uploading showreel...' : 'Replace showreel'}</span>
                  </button>
                  <span className="text-[11px] text-white/50">MP4 or WebM up to 200 MB.</span>
                </div>

                {/* Poster Frame Picker Slider */}
                {(siteContent.showreelKey || videoBlobUrl) && (
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 font-medium">
                        Choose poster frame: {formatSeconds(currentTimeSlider)} / {formatSeconds(videoDuration)}
                      </span>
                      <button
                        type="button"
                        disabled={isCapturingPoster}
                        onClick={captureFrameFromVideo}
                        className="px-3 py-1 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded text-xs cursor-pointer font-medium disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isCapturingPoster && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Capture this frame as poster</span>
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={videoDuration || 60}
                      step="0.1"
                      value={currentTimeSlider}
                      onChange={(e) => handleSeekFrame(parseFloat(e.target.value))}
                      className="w-full accent-[#8a307f] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Showreel Link (Optional) */}
            <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <LinkIcon className="w-4 h-4 text-[#ca57bb]" />
                <span>Showreel link (optional)</span>
              </div>
              <input
                type="url"
                ref={showreelLinkInputRef}
                placeholder="https://vimeo.com/... or https://youtube.com/..."
                value={siteContent.showreelLink || ''}
                onChange={(e) =>
                  setSiteContent({ ...siteContent, showreelLink: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
              <p className="text-[11px] text-white/50">
                If filled in, the public site plays this instead of the uploaded file.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingSiteContent}
                className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSavingSiteContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 3: PROJECT EDITOR ================= */}
        {activeTab === 'editor' && editingProject && (
          <form onSubmit={handleSaveEditingProject} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Editing: {editingProject.title}
                </h2>
                <span className="text-xs text-white/50">Slug: {editingProject.slug}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(editingProject.slug)}
                  className="min-h-[44px] px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewProject(editingProject.slug)}
                  className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  type="submit"
                  disabled={hasActiveUploads || isSaving}
                  className={`min-h-[44px] flex items-center gap-2 px-6 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer ${
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
                      ? 'Uploading...'
                      : isSaving
                      ? 'Saving...'
                      : 'Save'}
                  </span>
                </button>
              </div>
            </div>

            {saveError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Error saving project: {saveError}</span>
              </div>
            )}

            {/* Core Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Project title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditingProject({
                        ...editingProject,
                        title: newTitle,
                        slug: getSafeProjectSlug(newTitle),
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-[#14101c] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Client
                    </label>
                    <input
                      type="text"
                      value={editingProject.client}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, client: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
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
                      className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Role
                  </label>
                  <input
                    type="text"
                    value={editingProject.role}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Summary
                  </label>
                  <input
                    type="text"
                    value={editingProject.summary}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, summary: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={6}
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#14101c] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] leading-relaxed"
                  />
                </div>
              </div>

              {/* Sidebar controls */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#130f1a] border border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Status
                    </label>
                    <select
                      value={editingProject.status}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          status: e.target.value as 'draft' | 'published',
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
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
                      className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                    >
                      <option value="branding">Brand identity</option>
                      <option value="motion">Motion</option>
                      <option value="poster">Poster & print</option>
                      <option value="social">Social & digital</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-white/70">Featured</span>
                    <input
                      type="checkbox"
                      checked={editingProject.featured}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, featured: e.target.checked })
                      }
                      className="w-5 h-5 accent-[#8a307f] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Sort order
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
                      className="w-full px-3 py-1.5 bg-[#0b0811] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#130f1a] border border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Challenge
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
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Solution
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
                <h3 className="font-display text-xl font-bold">Files</h3>

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
                    className="min-h-[44px] flex items-center gap-2 px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload files</span>
                  </button>
                </div>
              </div>

              {/* Upload tasks */}
              {uploadTasks.length > 0 && (
                <div className="p-4 rounded-xl bg-[#16121f] border border-white/10 space-y-3">
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
                              <span>Uploaded</span>
                            </span>
                          )}
                          {t.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryUpload(t)}
                              className="min-h-[36px] flex items-center gap-1 text-amber-300 hover:text-amber-200 bg-amber-500/20 px-2 py-1 rounded cursor-pointer"
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

              {/* Assets list */}
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
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0a080d] mb-3 border border-white/10">
                          <img
                            src={previewSrc}
                            alt={asset.alt || 'Asset'}
                            className="w-full h-full object-cover"
                          />
                          {isCover && (
                            <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-[#8a307f] text-white px-2 py-0.5 rounded font-semibold">
                              Cover
                            </span>
                          )}
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 text-white px-2 py-0.5 rounded uppercase">
                            {asset.type}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">
                              Alt text
                            </label>
                            <input
                              type="text"
                              value={asset.alt}
                              onChange={(e) => {
                                const updatedAssets = [...editingProject.assets];
                                updatedAssets[idx].alt = e.target.value;
                                setEditingProject({ ...editingProject, assets: updatedAssets });
                              }}
                              className="w-full px-2 py-1.5 bg-[#0b0811] border border-white/10 rounded text-white text-xs min-h-[36px]"
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
                              className={`min-h-[36px] text-xs font-medium cursor-pointer ${
                                isCover ? 'text-[#ca57bb]' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              {isCover ? '✓ Main cover' : 'Set as cover'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAsset(asset)}
                              className="min-h-[36px] text-red-400 hover:text-red-300 p-2 cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
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
                  <UploadCloud className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white/80">No files uploaded yet.</p>
                  <p className="text-xs text-white/40 mt-0.5">Click to upload JPG, PNG, WebP, MP4, or PDF.</p>
                </div>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
