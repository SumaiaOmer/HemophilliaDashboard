import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LookupItem, LookupItemRequest, LOOKUP_TYPES } from '../../services/lookups';

interface LookupFormProps {
  item?: LookupItem | null;
  defaultType?: string;
  onSave: (item: LookupItemRequest) => Promise<void>;
  onCancel: () => void;
}

export const LookupForm: React.FC<LookupFormProps> = ({
  item,
  defaultType,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState(item?.type ?? defaultType ?? LOOKUP_TYPES[0].value);
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
    if (!name.trim() || !type) {
      setError('Both name and type are required');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({ name: name.trim(), type });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lookup item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {item ? 'Edit Lookup Item' : 'Add Lookup Item'}
          </h3>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-sm text-red-700 flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lookup Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              disabled={!!item}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            >
              {LOOKUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {item && (
              <p className="mt-1.5 text-xs text-gray-400">
                Type cannot be changed after creation
              </p>
            )}
          </div>

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

          {/* Actions */}
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
                <span>{item ? 'Update' : 'Create'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
