import React, { useState, useRef } from 'react';
import { Testimonial } from '../../types';
import { uploadFileDirectToR2, getMediaAssetUrl } from '../../services/storageService';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  UploadCloud,
  Quote,
  MessageSquareQuote,
  AlertCircle,
  Loader2,
  X,
  User,
} from 'lucide-react';

interface TestimonialsContentEditorProps {
  initialTestimonials: Testimonial[];
  onSave: (updatedTestimonials: Testimonial[]) => Promise<void>;
  showToast: (msg: string) => void;
}

export const TestimonialsContentEditor: React.FC<TestimonialsContentEditorProps> = ({
  initialTestimonials,
  onSave,
  showToast,
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    return Array.isArray(initialTestimonials) && initialTestimonials.length > 0
      ? [...initialTestimonials]
      : [];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // --- Start Create Testimonial ---
  const handleStartCreate = () => {
    const newTestimonial: Testimonial = {
      id: `test-${Date.now()}`,
      clientName: '',
      role: 'Founder',
      company: '',
      quote: '',
      project: '',
      location: 'Nairobi, Kenya',
      imageKey: null,
      imageUrl: null,
      visible: true,
      sortOrder: testimonials.length + 1,
    };
    setEditingTestimonial(newTestimonial);
    setIsCreatingNew(true);
  };

  // --- Start Edit Testimonial ---
  const handleStartEdit = (t: Testimonial) => {
    setEditingTestimonial({ ...t });
    setIsCreatingNew(false);
  };

  // --- Cancel Form ---
  const handleCancelForm = () => {
    setEditingTestimonial(null);
    setIsCreatingNew(false);
  };

  // --- Save Form (Add or Edit) ---
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    if (!editingTestimonial.clientName.trim()) {
      showToast('Client name is required.');
      return;
    }
    if (!editingTestimonial.quote.trim()) {
      showToast('Quote text is required.');
      return;
    }

    let updatedList: Testimonial[];
    if (isCreatingNew) {
      updatedList = [
        ...testimonials,
        {
          ...editingTestimonial,
          clientName: editingTestimonial.clientName.trim(),
          quote: editingTestimonial.quote.trim(),
        },
      ];
    } else {
      updatedList = testimonials.map((t) =>
        t.id === editingTestimonial.id ? editingTestimonial : t
      );
    }

    // Re-index sortOrder
    updatedList = updatedList.map((t, idx) => ({
      ...t,
      sortOrder: idx + 1,
    }));

    setTestimonials(updatedList);
    setEditingTestimonial(null);
    setIsCreatingNew(false);

    await persistTestimonials(
      updatedList,
      isCreatingNew ? 'Testimonial added.' : 'Testimonial updated.'
    );
  };

  // --- Delete confirmation ---
  const handleConfirmDelete = async () => {
    if (!testimonialToDelete) return;
    const updatedList = testimonials
      .filter((t) => t.id !== testimonialToDelete.id)
      .map((t, idx) => ({ ...t, sortOrder: idx + 1 }));

    setTestimonials(updatedList);
    if (editingTestimonial?.id === testimonialToDelete.id) {
      setEditingTestimonial(null);
      setIsCreatingNew(false);
    }
    const name = testimonialToDelete.clientName;
    setTestimonialToDelete(null);

    await persistTestimonials(updatedList, `Testimonial from "${name}" deleted.`);
  };

  // --- Toggle Visibility ---
  const handleToggleVisibility = async (item: Testimonial) => {
    const updatedList = testimonials.map((t) =>
      t.id === item.id ? { ...t, visible: t.visible === false ? true : false } : t
    );
    setTestimonials(updatedList);
    await persistTestimonials(
      updatedList,
      `Testimonial ${item.visible === false ? 'shown on website' : 'hidden from website'}.`
    );
  };

  // --- Reorder ---
  const moveTestimonial = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= testimonials.length) return;

    const updatedList = [...testimonials];
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIdx];
    updatedList[targetIdx] = temp;

    const reindexed = updatedList.map((t, idx) => ({
      ...t,
      sortOrder: idx + 1,
    }));

    setTestimonials(reindexed);
    await persistTestimonials(reindexed, 'Testimonials order updated.');
  };

  // --- Save to backend ---
  const persistTestimonials = async (listToSave: Testimonial[], successMsg: string) => {
    setIsSaving(true);
    try {
      await onSave(listToSave);
      showToast(successMsg);
    } catch (err: any) {
      showToast(err.message || 'Failed saving testimonials.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Avatar Upload ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTestimonial) return;

    setIsUploadingAvatar(true);
    try {
      const assetId = `testimonial-${Date.now()}`;
      const uploadRes = await uploadFileDirectToR2(file, {
        projectSlug: 'site',
        assetId,
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        variant: 'original',
      });
      setEditingTestimonial({
        ...editingTestimonial,
        imageKey: uploadRes.key,
      });
      showToast('Client photo uploaded.');
    } catch (err: any) {
      showToast(err.message || 'Photo upload failed.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {testimonialToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Delete Testimonial</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Are you sure you want to permanently delete the testimonial from{' '}
              <span className="text-white font-semibold">
                &ldquo;{testimonialToDelete.clientName}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setTestimonialToDelete(null)}
                className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[44px] px-5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer transition-colors shadow-sm"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-[#ca57bb]" />
            <span>Manage Testimonials</span>
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Client quotes, roles, organizations, avatar photos, order, and display visibility.
          </p>
        </div>

        {!editingTestimonial && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Testimonial</span>
          </button>
        )}
      </div>

      {/* Testimonial Editor Form */}
      {editingTestimonial ? (
        <form
          onSubmit={handleSaveForm}
          className="p-6 rounded-2xl bg-[#14101c] border border-[#8a307f]/50 space-y-6 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Quote className="w-4 h-4 text-[#ca57bb]" />
              <span>
                {isCreatingNew
                  ? 'Add New Testimonial'
                  : `Editing Testimonial: ${editingTestimonial.clientName}`}
              </span>
            </h4>
            <button
              type="button"
              onClick={handleCancelForm}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={editingTestimonial.clientName}
                placeholder="e.g. Wambui Karanja"
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                value={editingTestimonial.role}
                placeholder="e.g. Founder, Creative Director"
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, role: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={editingTestimonial.company}
                placeholder="e.g. Kahava Specialty Roasters"
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, company: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Project Name (Optional)
              </label>
              <input
                type="text"
                value={editingTestimonial.project || ''}
                placeholder="e.g. Kahava Rebrand"
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, project: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Location (Optional)
              </label>
              <input
                type="text"
                value={editingTestimonial.location || ''}
                placeholder="e.g. Nairobi, Kenya"
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, location: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={editingTestimonial.sortOrder ?? 1}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    sortOrder: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3.5 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>
          </div>

          {/* Testimonial Quote */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Testimonial Quote *
            </label>
            <textarea
              rows={4}
              required
              value={editingTestimonial.quote}
              placeholder="What did the client say about working with Liz Kendi?"
              onChange={(e) =>
                setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })
              }
              className="w-full p-3 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] leading-relaxed"
            />
          </div>

          {/* Avatar Profile Photo Upload */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="block text-xs font-medium text-white/70">
              Client Profile Photo (Optional)
            </label>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-black/40 border border-[#ca57bb]/40 shrink-0 flex items-center justify-center">
                {editingTestimonial.imageKey || editingTestimonial.imageUrl ? (
                  <img
                    src={
                      editingTestimonial.imageKey
                        ? getMediaAssetUrl(editingTestimonial.imageKey)
                        : editingTestimonial.imageUrl || ''
                    }
                    alt={editingTestimonial.clientName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[#ca57bb] font-bold text-base">
                    {editingTestimonial.clientName ? editingTestimonial.clientName.charAt(0) : <User className="w-6 h-6 text-white/20" />}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="min-h-[38px] px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#ca57bb]" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-[#ca57bb]" />
                    )}
                    <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}</span>
                  </button>

                  {(editingTestimonial.imageKey || editingTestimonial.imageUrl) && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTestimonial({
                          ...editingTestimonial,
                          imageKey: null,
                          imageUrl: null,
                        })
                      }
                      className="min-h-[38px] px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-white/40">Square portrait photo recommended.</p>
              </div>
            </div>
          </div>

          {/* Visibility Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="test-visible"
              checked={editingTestimonial.visible !== false}
              onChange={(e) =>
                setEditingTestimonial({ ...editingTestimonial, visible: e.target.checked })
              }
              className="w-4 h-4 accent-[#8a307f] cursor-pointer"
            />
            <label
              htmlFor="test-visible"
              className="text-xs text-white/80 cursor-pointer select-none"
            >
              Show this testimonial on the live website
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancelForm}
              className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] flex items-center gap-2 px-6 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-xs font-semibold text-white cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isCreatingNew ? 'Create Testimonial' : 'Save Testimonial'}</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/10 bg-[#120f18] space-y-3">
          <MessageSquareQuote className="w-8 h-8 text-white/30 mx-auto" />
          <p className="text-sm text-white/70">No testimonials created yet.</p>
          <button
            type="button"
            onClick={handleStartCreate}
            className="min-h-[40px] px-5 py-2 bg-[#8a307f] hover:bg-[#9e3992] rounded-xl text-xs font-semibold text-white cursor-pointer"
          >
            Create first testimonial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((item, idx) => {
            const avatarSrc = item.imageKey
              ? getMediaAssetUrl(item.imageKey)
              : item.imageUrl || '';
            const isHidden = item.visible === false;

            return (
              <div
                key={item.id || `test-${idx}`}
                className={`p-5 rounded-2xl border transition-all ${
                  isHidden
                    ? 'bg-[#0f0c15] border-white/5 opacity-60'
                    : 'bg-[#14101c] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar preview */}
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={item.clientName}
                        className="w-12 h-12 rounded-full object-cover border border-[#ca57bb]/40 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#8a307f]/20 border border-[#8a307f]/40 flex items-center justify-center font-bold text-sm text-[#ca57bb] shrink-0">
                        {item.clientName ? item.clientName.charAt(0) : '?'}
                      </div>
                    )}

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-sans text-sm font-bold text-white">
                          {item.clientName}
                        </h4>
                        <span className="text-xs text-[#ca57bb]">
                          {item.role}
                          {item.company ? `, ${item.company}` : ''}
                        </span>
                        {item.location && (
                          <span className="text-[11px] font-mono text-white/40">
                            • {item.location}
                          </span>
                        )}
                        {item.project && (
                          <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-white/60">
                            {item.project}
                          </span>
                        )}
                        {isHidden && (
                          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                            Hidden from website
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-white/80 italic font-serif leading-relaxed line-clamp-3">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                    {/* Reorder Buttons */}
                    <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => moveTestimonial(idx, 'up')}
                        disabled={idx === 0}
                        title="Move up"
                        className="p-1.5 text-white/60 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTestimonial(idx, 'down')}
                        disabled={idx === testimonials.length - 1}
                        title="Move down"
                        className="p-1.5 text-white/60 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item)}
                      title={isHidden ? 'Show on website' : 'Hide from website'}
                      className={`min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg border transition-colors cursor-pointer ${
                        isHidden
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="min-h-[36px] px-3.5 flex items-center gap-1.5 rounded-lg bg-[#8a307f] hover:bg-[#9e3992] text-white text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setTestimonialToDelete(item)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 cursor-pointer"
                      title="Delete testimonial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
