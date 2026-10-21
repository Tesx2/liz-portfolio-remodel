import React, { useState, useRef } from 'react';
import { ServiceItem } from '../../types';
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
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  Loader2,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface ServicesContentEditorProps {
  initialServices: ServiceItem[];
  onSave: (updatedServices: ServiceItem[]) => Promise<void>;
  showToast: (msg: string) => void;
}

export const ServicesContentEditor: React.FC<ServicesContentEditorProps> = ({
  initialServices,
  onSave,
  showToast,
}) => {
  const [services, setServices] = useState<ServiceItem[]>(() => {
    return Array.isArray(initialServices) && initialServices.length > 0
      ? [...initialServices]
      : [];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDeliverableInput, setNewDeliverableInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Start Create Service ---
  const handleStartCreate = () => {
    const nextNumber = String(services.length + 1).padStart(2, '0');
    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      number: nextNumber,
      title: '',
      category: 'Design & Motion',
      description: '',
      deliverables: [],
      timeline: '2–3 Weeks',
      visible: true,
      sortOrder: services.length + 1,
      imageKey: null,
      imageUrl: null,
    };
    setEditingService(newService);
    setIsCreatingNew(true);
    setNewDeliverableInput('');
  };

  // --- Start Edit Service ---
  const handleStartEdit = (service: ServiceItem) => {
    setEditingService({
      ...service,
      deliverables: Array.isArray(service.deliverables) ? [...service.deliverables] : [],
    });
    setIsCreatingNew(false);
    setNewDeliverableInput('');
  };

  // --- Cancel Form ---
  const handleCancelForm = () => {
    setEditingService(null);
    setIsCreatingNew(false);
    setNewDeliverableInput('');
  };

  // --- Save Form (Add or Edit) ---
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editingService.title.trim()) {
      showToast('Please enter a service title.');
      return;
    }

    let updatedList: ServiceItem[];
    if (isCreatingNew) {
      updatedList = [...services, { ...editingService, title: editingService.title.trim() }];
    } else {
      updatedList = services.map((s) =>
        s.id === editingService.id || s.number === editingService.number ? editingService : s
      );
    }

    // Re-index sortOrder
    updatedList = updatedList.map((s, idx) => ({
      ...s,
      sortOrder: idx + 1,
    }));

    setServices(updatedList);
    setEditingService(null);
    setIsCreatingNew(false);

    // Save to backend
    await persistServices(updatedList, isCreatingNew ? 'Service created.' : 'Service updated.');
  };

  // --- Delete confirmation ---
  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    const updatedList = services
      .filter((s) => s.id !== serviceToDelete.id && s.title !== serviceToDelete.title)
      .map((s, idx) => ({ ...s, sortOrder: idx + 1 }));

    setServices(updatedList);
    if (editingService?.id === serviceToDelete.id) {
      setEditingService(null);
      setIsCreatingNew(false);
    }
    const deletedTitle = serviceToDelete.title;
    setServiceToDelete(null);

    await persistServices(updatedList, `Service "${deletedTitle}" deleted.`);
  };

  // --- Toggle Visibility ---
  const handleToggleVisibility = async (service: ServiceItem) => {
    const updatedList = services.map((s) =>
      s.id === service.id ? { ...s, visible: s.visible === false ? true : false } : s
    );
    setServices(updatedList);
    await persistServices(
      updatedList,
      `Service visibility ${service.visible === false ? 'enabled' : 'hidden'}.`
    );
  };

  // --- Reorder Service ---
  const moveService = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= services.length) return;

    const updatedList = [...services];
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIdx];
    updatedList[targetIdx] = temp;

    // Update sortOrder
    const reindexed = updatedList.map((s, idx) => ({
      ...s,
      sortOrder: idx + 1,
    }));

    setServices(reindexed);
    await persistServices(reindexed, 'Services order updated.');
  };

  // --- Save to backend ---
  const persistServices = async (listToSave: ServiceItem[], successMsg: string) => {
    setIsSaving(true);
    try {
      await onSave(listToSave);
      showToast(successMsg);
    } catch (err: any) {
      showToast(err.message || 'Failed saving services.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Image Upload for Service ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    setIsUploadingImage(true);
    try {
      const assetId = `service-${Date.now()}`;
      const uploadRes = await uploadFileDirectToR2(file, {
        projectSlug: 'site',
        assetId,
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        variant: 'original',
      });
      setEditingService({
        ...editingService,
        imageKey: uploadRes.key,
      });
      showToast('Service image uploaded.');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Deliverables in form ---
  const handleAddDeliverable = () => {
    if (!newDeliverableInput.trim() || !editingService) return;
    setEditingService({
      ...editingService,
      deliverables: [...editingService.deliverables, newDeliverableInput.trim()],
    });
    setNewDeliverableInput('');
  };

  const handleRemoveDeliverable = (idx: number) => {
    if (!editingService) return;
    setEditingService({
      ...editingService,
      deliverables: editingService.deliverables.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#14101c] border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Delete Service</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="text-white font-semibold">
                &ldquo;{serviceToDelete.title}&rdquo;
              </span>
              ? This service will be removed from your public website.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
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
            <Briefcase className="w-5 h-5 text-[#ca57bb]" />
            <span>Manage Services</span>
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Add, edit, reorder, and configure client offerings displayed on your website.
          </p>
        </div>

        {!editingService && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        )}
      </div>

      {/* Service Editor Modal / Inline Form */}
      {editingService ? (
        <form
          onSubmit={handleSaveForm}
          className="p-6 rounded-2xl bg-[#14101c] border border-[#8a307f]/50 space-y-6 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-[#ca57bb] font-mono">{editingService.number || '01'}</span>
              <span>{isCreatingNew ? 'Add New Service' : `Editing: ${editingService.title}`}</span>
            </h4>
            <button
              type="button"
              onClick={handleCancelForm}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Number
              </label>
              <input
                type="text"
                value={editingService.number}
                placeholder="01"
                onChange={(e) =>
                  setEditingService({ ...editingService, number: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Service Title *
              </label>
              <input
                type="text"
                required
                value={editingService.title}
                placeholder="Brand identity, 2D/3D animation, etc."
                onChange={(e) =>
                  setEditingService({ ...editingService, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={editingService.category}
                placeholder="Branding, Motion, Art"
                onChange={(e) =>
                  setEditingService({ ...editingService, category: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Timeline / Turnaround
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editingService.timeline || ''}
                  placeholder="2–4 Weeks"
                  onChange={(e) =>
                    setEditingService({ ...editingService, timeline: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
                />
                <Clock className="w-4 h-4 text-[#ca57bb] absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={editingService.sortOrder ?? 1}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    sortOrder: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[44px]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={editingService.description}
              placeholder="Describe what this service encompasses and what clients can expect..."
              onChange={(e) =>
                setEditingService({ ...editingService, description: e.target.value })
              }
              className="w-full p-3 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] leading-relaxed"
            />
          </div>

          {/* Deliverables List */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">
              Included Deliverables
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editingService.deliverables.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ca57bb]" />
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="p-0.5 hover:text-red-400 text-white/40 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Brand guidelines, 3D animated loop, Vector logo..."
                value={newDeliverableInput}
                onChange={(e) => setNewDeliverableInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDeliverable();
                  }
                }}
                className="flex-1 px-3 py-2 bg-[#0b0811] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] min-h-[40px]"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                disabled={!newDeliverableInput.trim()}
                className="min-h-[40px] px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-semibold text-white rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Service Image / Banner */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="block text-xs font-medium text-white/70">
              Service Image / Banner (Optional)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-36 aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                {editingService.imageKey || editingService.imageUrl ? (
                  <img
                    src={
                      editingService.imageKey
                        ? getMediaAssetUrl(editingService.imageKey)
                        : editingService.imageUrl || ''
                    }
                    alt={editingService.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white/20 flex flex-col items-center gap-1">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#ca57bb]" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-[#ca57bb]" />
                    )}
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  </button>

                  {(editingService.imageKey || editingService.imageUrl) && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingService({
                          ...editingService,
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
                <p className="text-[11px] text-white/40">
                  Displayed at top of service card (16:9 recommended).
                </p>
              </div>
            </div>
          </div>

          {/* Visibility Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="service-visible"
              checked={editingService.visible !== false}
              onChange={(e) =>
                setEditingService({ ...editingService, visible: e.target.checked })
              }
              className="w-4 h-4 accent-[#8a307f] cursor-pointer"
            />
            <label
              htmlFor="service-visible"
              className="text-xs text-white/80 cursor-pointer select-none"
            >
              Show this service on the live website
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
              <span>{isCreatingNew ? 'Create Service' : 'Save Service'}</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Services List View */}
      {services.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/10 bg-[#120f18] space-y-3">
          <Briefcase className="w-8 h-8 text-white/30 mx-auto" />
          <p className="text-sm text-white/70">No services created yet.</p>
          <button
            type="button"
            onClick={handleStartCreate}
            className="min-h-[40px] px-5 py-2 bg-[#8a307f] hover:bg-[#9e3992] rounded-xl text-xs font-semibold text-white cursor-pointer"
          >
            Create first service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service, idx) => {
            const imgSrc = service.imageKey
              ? getMediaAssetUrl(service.imageKey)
              : service.imageUrl || '';
            const isHidden = service.visible === false;

            return (
              <div
                key={service.id || `srv-${idx}`}
                className={`p-5 rounded-2xl border transition-all ${
                  isHidden
                    ? 'bg-[#0f0c15] border-white/5 opacity-60'
                    : 'bg-[#14101c] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Number badge */}
                    <div className="w-10 h-10 rounded-xl bg-[#8a307f]/15 border border-[#8a307f]/30 flex items-center justify-center font-display font-bold text-[#ca57bb] shrink-0 text-sm">
                      {service.number || String(idx + 1).padStart(2, '0')}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-display text-base font-bold text-white">
                          {service.title}
                        </h4>
                        {service.category && (
                          <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-[#ca57bb] px-2 py-0.5 rounded">
                            {service.category}
                          </span>
                        )}
                        {service.timeline && (
                          <span className="text-[11px] font-mono text-white/50 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#ca57bb]" />
                            <span>{service.timeline}</span>
                          </span>
                        )}
                        {isHidden && (
                          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                            Hidden from website
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed">
                        {service.description || 'No description provided.'}
                      </p>

                      {/* Deliverables tags */}
                      {service.deliverables && service.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {service.deliverables.map((deliv, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[11px] font-mono text-white/60 bg-white/[0.04] px-2 py-0.5 rounded"
                            >
                              • {deliv}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side thumbnail if present */}
                  {imgSrc && (
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 hidden md:block">
                      <img
                        src={imgSrc}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                    {/* Reorder Buttons */}
                    <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => moveService(idx, 'up')}
                        disabled={idx === 0}
                        title="Move up"
                        className="p-1.5 text-white/60 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveService(idx, 'down')}
                        disabled={idx === services.length - 1}
                        title="Move down"
                        className="p-1.5 text-white/60 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(service)}
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
                      onClick={() => handleStartEdit(service)}
                      className="min-h-[36px] px-3.5 flex items-center gap-1.5 rounded-lg bg-[#8a307f] hover:bg-[#9e3992] text-white text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setServiceToDelete(service)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 cursor-pointer"
                      title="Delete service"
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
