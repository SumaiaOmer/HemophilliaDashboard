import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LookupType, LookupItem, LookupsService } from '../../services/lookups';

interface LookupTypeFormProps {
  type?: LookupType | null;
  parentTypes: LookupType[];
  existingTypeNames: string[];
  onSave: (typeName: string, parentTypeId: string | null) => Promise<void>;
  onCancel: () => void;
}

export const LookupTypeForm: React.FC<LookupTypeFormProps> = ({
  type,
  parentTypes,
  existingTypeNames,
  onSave,
  onCancel,
}) => {
  const [typeName, setTypeName] = useState(type?.name ?? '');
  const [parentTypeId, setParentTypeId] = useState<string>('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = typeName.trim();
    if (!trimmed) {
      setError('Type name is required');
      return;
    }
    const lower = trimmed.toLowerCase();
    if (!type && existingTypeNames.some((n) => n.toLowerCase() === lower)) {
      setError('A type with this name already exists');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(trimmed, parentTypeId || null);
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
            <input
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              required
              autoFocus
              disabled={!!type}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              placeholder="e.g. BloodGroups, SudanStates"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              A root item with Name = Type will be created in the API. Cannot be renamed later.
            </p>
          </div>

          {parentTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parent Type <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={parentTypeId}
                onChange={(e) => setParentTypeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              >
                <option value="">None (top-level type)</option>
                {parentTypes
                  .filter((pt) => pt.name !== type?.name)
                  .map((pt) => (
                    <option key={pt.name} value={pt.rootItemId ?? pt.name}>
                      {pt.label}
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-400">
                Selecting a parent links this type's root item to the parent type's root item
              </p>
            </div>
          )}

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
