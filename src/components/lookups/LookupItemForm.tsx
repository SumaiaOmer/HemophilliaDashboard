import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LookupItem, LookupItemRequest, TypeMeta, LookupsService } from '../../services/lookups';

interface LookupItemFormProps {
  item?: LookupItem | null;
  defaultType?: string;
  availableTypes: TypeMeta[];
  onSave: (item: LookupItemRequest) => Promise<void>;
  onCancel: () => void;
}

export const LookupItemForm: React.FC<LookupItemFormProps> = ({
  item,
  defaultType,
  availableTypes,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(item?.name ?? '');
  const [typeKey, setTypeKey] = useState<string>(item?.type ?? defaultType ?? '');
  const [parentId, setParentId] = useState<string>(item?.parentId ?? '');
  const [parentItems, setParentItems] = useState<LookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = availableTypes.find((t) => t.name === typeKey);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isSubmitting, onCancel]);

  // Reset parentId when type changes (unless editing existing item)
  useEffect(() => {
    if (item && item.type === typeKey) {
      setParentId(item.parentId ?? '');
    } else {
      setParentId('');
    }
  }, [typeKey, item]);

  // If selected type has a parent type, fetch parent type's items for the parent dropdown
  useEffect(() => {
    if (selectedType?.parentType) {
      LookupsService.getByType(selectedType.parentType)
        .then(setParentItems)
        .catch(() => setParentItems([]));
    } else {
      setParentItems([]);
    }
  }, [selectedType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !typeKey) {
      setError('Both name and type are required');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        type: typeKey,
        parentId: parentId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lookup item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {item ? 'Edit Lookup Item' : 'Add Lookup Item'}
          </h3>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-sm text-red-700 flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lookup Type <span className="text-red-500">*</span>
            </label>
            <select
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
              required
              disabled={!!item}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">Select a type</option>
              {availableTypes.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label}
                </option>
              ))}
            </select>
            {item && (
              <p className="mt-1.5 text-xs text-gray-400">Type cannot be changed after creation</p>
            )}
            {availableTypes.length === 0 && (
              <p className="mt-1.5 text-xs text-red-500">No lookup types found. Create a type first.</p>
            )}
          </div>

          {selectedType?.parentType && parentItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parent Item <span className="text-gray-400 font-normal">(from "{selectedType.parentType}")</span>
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              >
                <option value="">None (top-level item)</option>
                {parentItems.map((pi) => (
                  <option key={pi.id} value={pi.id}>
                    {pi.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              placeholder="Enter lookup item name"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !typeKey}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>{item ? 'Update' : 'Create'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
