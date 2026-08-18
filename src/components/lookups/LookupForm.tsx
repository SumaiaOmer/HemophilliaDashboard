import React, { useState } from 'react';
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
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {item ? 'Edit Lookup Item' : 'Add Lookup Item'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lookup Type *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            disabled={!!item}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {LOOKUP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {item && (
            <p className="mt-1 text-xs text-gray-500">
              Type cannot be changed after creation
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            placeholder="Enter lookup item name"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{item ? 'Update' : 'Create'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
