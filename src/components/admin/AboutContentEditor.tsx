import React, { useState, useRef } from 'react';
import { AboutContent, AboutTool, AboutMilestone } from '../../types';
import { uploadFileDirectToR2, getMediaAssetUrl } from '../../services/storageService';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X,
  Sparkles,
  GraduationCap,
  Wrench,
} from 'lucide-react';

interface AboutContentEditorProps {
  initialAbout: AboutContent;
  onSave: (updatedAbout: AboutContent) => Promise<void>;
  showToast: (msg: string) => void;
}

export const AboutContentEditor: React.FC<AboutContentEditorProps> = ({
  initialAbout,
  onSave,
  showToast,
}) => {
  const [formData, setFormData] = useState<AboutContent>({
    title: initialAbout.title || 'About me',
    roleTitle: initialAbout.roleTitle || 'Graphic designer and animator',
    location: initialAbout.location || 'Nairobi, KE',
    bioParagraphs: Array.isArray(initialAbout.bioParagraphs)
      ? [...initialAbout.bioParagraphs]
      : [],
    cvDownloadUrl: initialAbout.cvDownloadUrl || '/liz-kendi-cv.pdf',
    tools: Array.isArray(initialAbout.tools) ? [...initialAbout.tools] : [],
    milestones: Array.isArray(initialAbout.milestones) ? [...initialAbout.milestones] : [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [newParagraphText, setNewParagraphText] = useState('');
  const [editingParagraphIdx, setEditingParagraphIdx] = useState<number | null>(null);
  const [paragraphEditText, setParagraphEditText] = useState('');

  // Tool inline form state
  const [newTool, setNewTool] = useState<{ name: string; category: string }>({
    name: '',
    category: '',
  });
  const [editingToolIdx, setEditingToolIdx] = useState<number | null>(null);
  const [editToolData, setEditToolData] = useState<{ name: string; category: string }>({
    name: '',
    category: '',
  });

  // Milestone inline form state
  const [newMilestone, setNewMilestone] = useState<{ year: string; title: string; place: string }>({
    year: '',
    title: '',
    place: '',
  });
  const [editingMilestoneIdx, setEditingMilestoneIdx] = useState<number | null>(null);
  const [editMilestoneData, setEditMilestoneData] = useState<{
    year: string;
    title: string;
    place: string;
  }>({
    year: '',
    title: '',
    place: '',
  });

  // Delete confirmation modals
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'paragraph' | 'tool' | 'milestone';
    index: number;
    label: string;
  } | null>(null);

  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // --- Paragraph actions ---
  const handleAddParagraph = () => {
    if (!newParagraphText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      bioParagraphs: [...prev.bioParagraphs, newParagraphText.trim()],
    }));
    setNewParagraphText('');
  };

  const handleSaveParagraphEdit = (idx: number) => {
    if (!paragraphEditText.trim()) return;
    const updated = [...formData.bioParagraphs];
    updated[idx] = paragraphEditText.trim();
    setFormData((prev) => ({ ...prev, bioParagraphs: updated }));
    setEditingParagraphIdx(null);
    setParagraphEditText('');
  };

  const moveParagraph = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formData.bioParagraphs.length) return;
    const updated = [...formData.bioParagraphs];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFormData((prev) => ({ ...prev, bioParagraphs: updated }));
  };

  // --- Tool actions ---
  const handleAddTool = () => {
    if (!newTool.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      tools: [
        ...prev.tools,
        {
          name: newTool.name.trim(),
          category: newTool.category.trim() || 'General',
        },
      ],
    }));
    setNewTool({ name: '', category: '' });
  };

  const handleSaveToolEdit = (idx: number) => {
    if (!editToolData.name.trim()) return;
    const updated = [...formData.tools];
    updated[idx] = {
      name: editToolData.name.trim(),
      category: editToolData.category.trim() || 'General',
    };
    setFormData((prev) => ({ ...prev, tools: updated }));
    setEditingToolIdx(null);
  };

  const moveTool = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formData.tools.length) return;
    const updated = [...formData.tools];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFormData((prev) => ({ ...prev, tools: updated }));
  };

  // --- Milestone actions ---
  const handleAddMilestone = () => {
    if (!newMilestone.title.trim()) return;
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          year: newMilestone.year.trim() || `${new Date().getFullYear()}`,
          title: newMilestone.title.trim(),
          place: newMilestone.place.trim(),
        },
      ],
    }));
    setNewMilestone({ year: '', title: '', place: '' });
  };

  const handleSaveMilestoneEdit = (idx: number) => {
    if (!editMilestoneData.title.trim()) return;
    const updated = [...formData.milestones];
    updated[idx] = {
      year: editMilestoneData.year.trim() || updated[idx].year,
      title: editMilestoneData.title.trim(),
      place: editMilestoneData.place.trim(),
    };
    setFormData((prev) => ({ ...prev, milestones: updated }));
    setEditingMilestoneIdx(null);
  };

  const moveMilestone = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formData.milestones.length) return;
    const updated = [...formData.milestones];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFormData((prev) => ({ ...prev, milestones: updated }));
  };

  // --- Delete confirmation execution ---
  const executeDelete = () => {
    if (!deleteTarget) return;
    const { type, index } = deleteTarget;
    if (type === 'paragraph') {
      const updated = formData.bioParagraphs.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, bioParagraphs: updated }));
      showToast('Bio paragraph removed.');
    } else if (type === 'tool') {
      const updated = formData.tools.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, tools: updated }));
      showToast('Tool removed.');
    } else if (type === 'milestone') {
      const updated = formData.milestones.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, milestones: updated }));
      showToast('Milestone removed.');
    }
    setDeleteTarget(null);
  };

  // --- CV Upload ---
  const handleCvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a PDF file.');
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
      return;
    }

    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      showToast('CV file must be under 10 MB.');
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
      return;
    }

    setIsUploadingCv(true);
    try {
      const assetId = `cv-${Date.now()}`;
      const uploadRes = await uploadFileDirectToR2(file, {
        projectSlug: 'site',
        assetId,
        fileName: file.name,
        contentType: 'application/pdf',
        variant: 'original',
      });
      const resolvedUrl = getMediaAssetUrl(uploadRes.key);
      setFormData((prev) => ({
        ...prev,
        cvDownloadUrl: resolvedUrl,
      }));
      showToast('New CV uploaded successfully.');
    } catch (err: any) {
      showToast(err.message || 'CV upload failed.');
    } finally {
      setIsUploadingCv(false);
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
    }
  };

  // --- Save full About section ---
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      showToast('About Me section saved successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed saving About Me section.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: initialAbout.title || 'About me',
      roleTitle: initialAbout.roleTitle || 'Graphic designer and animator',
      location: initialAbout.location || 'Nairobi, KE',
      bioParagraphs: Array.isArray(initialAbout.bioParagraphs)
        ? [...initialAbout.bioParagraphs]
        : [],
      cvDownloadUrl: initialAbout.cvDownloadUrl || '/liz-kendi-cv.pdf',
      tools: Array.isArray(initialAbout.tools) ? [...initialAbout.tools] : [],
      milestones: Array.isArray(initialAbout.milestones) ? [...initialAbout.milestones] : [],
    });
    showToast('Reset to last saved version.');
  };

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="text-white font-semibold">&ldquo;{deleteTarget.label}&rdquo;</span>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="min-h-[44px] px-5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer transition-colors shadow-sm"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ca57bb]" />
            <span>Manage About Me</span>
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Personal bio, professional roles, skills & tools, education, and CV download.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancel / Reset</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save About Me'}</span>
          </button>
        </div>
      </div>

      {/* 1. Header Information */}
      <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>Main Details</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Section Title
            </label>
            <input
              type="text"
              value={formData.title || ''}
              placeholder="About me"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Role & Title
            </label>
            <input
              type="text"
              value={formData.roleTitle || ''}
              placeholder="Graphic designer and animator"
              onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Location Badge
            </label>
            <input
              type="text"
              value={formData.location || ''}
              placeholder="Nairobi, KE"
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* 2. Personal Introduction & Bio Paragraphs */}
      <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Bio & Introduction Paragraphs</h4>
            <p className="text-xs text-white/50 mt-0.5">
              Edit the story and personal narrative displayed in the About section.
            </p>
          </div>
          <span className="text-xs font-mono text-white/40">
            {formData.bioParagraphs.length} {formData.bioParagraphs.length === 1 ? 'paragraph' : 'paragraphs'}
          </span>
        </div>

        {/* Existing Paragraphs List */}
        <div className="space-y-3">
          {formData.bioParagraphs.map((para, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0b0811] border border-white/10 space-y-3"
            >
              {editingParagraphIdx === idx ? (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={paragraphEditText}
                    onChange={(e) => setParagraphEditText(e.target.value)}
                    className="w-full p-3 bg-[#14101c] border border-[#8a307f] rounded-lg text-xs text-white focus:outline-none leading-relaxed"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingParagraphIdx(null)}
                      className="min-h-[36px] px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveParagraphEdit(idx)}
                      className="min-h-[36px] px-4 rounded-lg bg-[#8a307f] hover:bg-[#9e3992] text-xs font-semibold text-white cursor-pointer"
                    >
                      Save paragraph
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal flex-1">
                    {para}
                  </p>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, 'up')}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, 'down')}
                      disabled={idx === formData.bioParagraphs.length - 1}
                      title="Move down"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingParagraphIdx(idx);
                        setParagraphEditText(para);
                      }}
                      title="Edit"
                      className="p-1.5 rounded-lg bg-[#8a307f]/20 hover:bg-[#8a307f]/30 text-[#ca57bb] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'paragraph',
                          index: idx,
                          label: para.substring(0, 40) + '...',
                        })
                      }
                      title="Delete"
                      className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Paragraph Box */}
        <div className="pt-2 space-y-2">
          <label className="block text-xs font-medium text-white/70">
            Add new paragraph
          </label>
          <div className="space-y-2">
            <textarea
              rows={3}
              value={newParagraphText}
              placeholder="Write a new paragraph for your bio..."
              onChange={(e) => setNewParagraphText(e.target.value)}
              className="w-full p-3 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] leading-relaxed"
            />
            <button
              type="button"
              onClick={handleAddParagraph}
              disabled={!newParagraphText.trim()}
              className="min-h-[38px] px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-semibold text-white rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Paragraph</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Skills & Tools */}
      <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#ca57bb]" />
            <h4 className="text-sm font-semibold text-white">Tools & Software Skills</h4>
          </div>
          <span className="text-xs font-mono text-white/40">
            {formData.tools.length} skills listed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formData.tools.map((tool, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#0b0811] border border-white/10 flex flex-col justify-between gap-3"
            >
              {editingToolIdx === idx ? (
                <div className="space-y-2 w-full">
                  <input
                    type="text"
                    value={editToolData.name}
                    placeholder="Tool name"
                    onChange={(e) => setEditToolData({ ...editToolData, name: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#14101c] border border-[#8a307f] rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    value={editToolData.category}
                    placeholder="Category"
                    onChange={(e) => setEditToolData({ ...editToolData, category: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#14101c] border border-white/10 rounded text-xs text-white"
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingToolIdx(null)}
                      className="px-2 py-1 bg-white/10 text-white rounded text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveToolEdit(idx)}
                      className="px-2 py-1 bg-[#8a307f] text-white rounded text-[11px] font-semibold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-xs font-semibold text-white block">{tool.name}</span>
                    <span className="text-[11px] font-mono text-[#ca57bb] block mt-0.5">
                      {tool.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveTool(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTool(idx, 'down')}
                        disabled={idx === formData.tools.length - 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingToolIdx(idx);
                          setEditToolData({ name: tool.name, category: tool.category });
                        }}
                        className="p-1 rounded bg-[#8a307f]/20 hover:bg-[#8a307f]/30 text-[#ca57bb] cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'tool',
                            index: idx,
                            label: tool.name,
                          })
                        }
                        className="p-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Tool Form */}
        <div className="p-4 rounded-xl bg-[#0b0811] border border-white/10 space-y-3">
          <span className="text-xs font-semibold text-white/80 block">Add New Tool or Skill</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Software / Skill (e.g. Maya)"
              value={newTool.name}
              onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
              className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
            />
            <input
              type="text"
              placeholder="Category (e.g. 3D Animation)"
              value={newTool.category}
              onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
              className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
            />
            <button
              type="button"
              onClick={handleAddTool}
              disabled={!newTool.name.trim()}
              className="min-h-[38px] px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] disabled:opacity-40 text-xs font-semibold text-white rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Education & Experience Milestones */}
      <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#ca57bb]" />
            <h4 className="text-sm font-semibold text-white">Education & Career Milestones</h4>
          </div>
          <span className="text-xs font-mono text-white/40">
            {formData.milestones.length} milestones
          </span>
        </div>

        <div className="space-y-3">
          {formData.milestones.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0b0811] border border-white/10"
            >
              {editingMilestoneIdx === idx ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editMilestoneData.year}
                      placeholder="Year (e.g. 2021 – 2024)"
                      onChange={(e) =>
                        setEditMilestoneData({ ...editMilestoneData, year: e.target.value })
                      }
                      className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editMilestoneData.title}
                      placeholder="Title / Qualification"
                      onChange={(e) =>
                        setEditMilestoneData({ ...editMilestoneData, title: e.target.value })
                      }
                      className="px-3 py-2 bg-[#14101c] border border-[#8a307f] rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editMilestoneData.place}
                      placeholder="Institution / Organization"
                      onChange={(e) =>
                        setEditMilestoneData({ ...editMilestoneData, place: e.target.value })
                      }
                      className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingMilestoneIdx(null)}
                      className="min-h-[34px] px-3 rounded-lg bg-white/10 text-xs text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveMilestoneEdit(idx)}
                      className="min-h-[34px] px-4 rounded-lg bg-[#8a307f] text-xs font-semibold text-white"
                    >
                      Save milestone
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium text-xs sm:text-sm">{m.title}</span>
                      <span className="text-[11px] font-mono text-[#ca57bb] bg-[#8a307f]/15 border border-[#8a307f]/30 px-2 py-0.5 rounded">
                        {m.year}
                      </span>
                    </div>
                    {m.place && (
                      <p className="text-xs text-white/50 mt-1 font-mono">{m.place}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => moveMilestone(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMilestone(idx, 'down')}
                      disabled={idx === formData.milestones.length - 1}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMilestoneIdx(idx);
                        setEditMilestoneData({
                          year: m.year,
                          title: m.title,
                          place: m.place,
                        });
                      }}
                      className="p-1.5 rounded bg-[#8a307f]/20 hover:bg-[#8a307f]/30 text-[#ca57bb] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'milestone',
                          index: idx,
                          label: m.title,
                        })
                      }
                      className="p-1.5 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Milestone Form */}
        <div className="p-4 rounded-xl bg-[#0b0811] border border-white/10 space-y-3">
          <span className="text-xs font-semibold text-white/80 block">
            Add New Qualification or Experience
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Year (e.g. 2024)"
              value={newMilestone.year}
              onChange={(e) => setNewMilestone({ ...newMilestone, year: e.target.value })}
              className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
            />
            <input
              type="text"
              placeholder="Title / Degree / Role"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
            />
            <input
              type="text"
              placeholder="Place / School / Company"
              value={newMilestone.place}
              onChange={(e) => setNewMilestone({ ...newMilestone, place: e.target.value })}
              className="px-3 py-2 bg-[#14101c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#8a307f]"
            />
            <button
              type="button"
              onClick={handleAddMilestone}
              disabled={!newMilestone.title.trim()}
              className="min-h-[38px] px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] disabled:opacity-40 text-xs font-semibold text-white rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. CV Download Management */}
      <div className="p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#ca57bb]" />
          <h4 className="text-sm font-semibold text-white">Curriculum Vitae (CV) Download</h4>
        </div>
        <p className="text-xs text-white/50">
          Specify a relative URL (e.g.{' '}
          <code className="text-[#ca57bb]">/liz-kendi-cv.pdf</code>), or upload a new PDF file directly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={formData.cvDownloadUrl || ''}
              placeholder="/liz-kendi-cv.pdf or https://..."
              onChange={(e) => setFormData({ ...formData, cvDownloadUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
            />
          </div>

          <div>
            <input
              type="file"
              ref={cvFileInputRef}
              accept="application/pdf"
              onChange={handleCvFileUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingCv}
              onClick={() => cvFileInputRef.current?.click()}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              {isUploadingCv ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#ca57bb]" />
              ) : (
                <UploadCloud className="w-4 h-4 text-[#ca57bb]" />
              )}
              <span>{isUploadingCv ? 'Uploading PDF...' : 'Upload new PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
        >
          Reset changes
        </button>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="min-h-[44px] flex items-center gap-2 px-7 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save About Me'}</span>
        </button>
      </div>
    </div>
  );
};
