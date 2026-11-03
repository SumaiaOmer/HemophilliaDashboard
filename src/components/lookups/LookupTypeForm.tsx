import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LookupItem, LookupType, LookupsService } from '../../services/lookups';

const LOCATION_TYPE_NAMES = ['State', 'City', 'Local Area'];
const CUSTOM_TYPE = '__custom__';

interface LookupTypeFormProps {
  type?: LookupType | null;
  defaultParentId?: string;
  onSave: (typeName: string, initialItemName: string | undefined, parentItemId: string | null) => Promise<void>;
  onCancel: () => void;
}

export const LookupTypeForm: React.FC<LookupTypeFormProps> = ({
  type,
  defaultParentId,
  onSave,
  onCancel,
}) => {
  const isKnownLocationType = type ? LOCATION_TYPE_NAMES.includes(type.name) : false;
  const [selectedTypeName, setSelectedTypeName] = useState(
    type ? (isKnownLocationType ? type.name : CUSTOM_TYPE) : ''
  );
  const [customTypeName, setCustomTypeName] = useState(
    type && !isKnownLocationType ? type.name : ''
  );
  const [initialItemName, setInitialItemName] = useState('');
  const [parentItemId, setParentItemId] = useState(defaultParentId ?? '0');
  const [parentItems, setParentItems] = useState<LookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    LookupsService.getAll()
      .then((items) => {
        setParentItems(items.filter((item) => item.name.toLowerCase() !== item.type.toLowerCase()));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load parent lookup items');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = (selectedTypeName === CUSTOM_TYPE ? customTypeName : selectedTypeName).trim();
    if (!trimmed) {
      setError('Type name is required');
      return;
    }
    const trimmedInitialItemName = initialItemName.trim();
    if (!type && !trimmedInitialItemName) {
      setError('Name is required');
      return;
    }
    if (trimmedInitialItemName && trimmedInitialItemName.toLowerCase() === trimmed.toLowerCase()) {
      setError('The first item name must be different from the type name');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(
        trimmed,
        type ? undefined : trimmedInitialItemName,
        parentItemId === '0' ? null : parentItemId
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lookup type');
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
            {type ? 'Edit Lookup Type' : 'Add Lookup Type'}
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
              Type Name <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTypeName}
              onChange={(e) => setSelectedTypeName(e.target.value)}
              required
              autoFocus
              disabled={!!type}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">Select a lookup type</option>
              {LOCATION_TYPE_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value={CUSTOM_TYPE}>Custom type</option>
            </select>
            {selectedTypeName === CUSTOM_TYPE && (
              <input
                type="text"
                value={customTypeName}
                onChange={(e) => setCustomTypeName(e.target.value)}
                required
                disabled={!!type}
                className="mt-3 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Enter custom lookup type name"
              />
            )}
            <p className="mt-1.5 text-xs text-gray-400">
              Choose State, City, or Local Area for location lookups. Custom types are also supported; names cannot be changed later.
            </p>
          </div>

          {!type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={initialItemName}
                onChange={(e) => setInitialItemName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                required
                placeholder="Enter the first lookup item name"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                This creates the first item for this lookup type.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Parent Item <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={parentItemId}
              onChange={(e) => setParentItemId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            >
              <option value="0">None (top-level item)</option>
              {parentItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              The new item will be linked to the selected parent item by name.
            </p>
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>{type ? 'Update' : 'Create'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
