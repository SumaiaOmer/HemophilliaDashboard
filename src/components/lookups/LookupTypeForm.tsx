import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { LookupItem, LookupType, LookupsService } from '../../services/lookups';

const LOCATION_TYPE_NAMES = ['SudanStates', 'City', 'LocalArea'];
const KNOWN_LOCATION_TYPE_NAMES = [...LOCATION_TYPE_NAMES, 'State', 'Local Area'];
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
  const isKnownLocationType = type ? KNOWN_LOCATION_TYPE_NAMES.includes(type.name) : false;
  const [selectedTypeName, setSelectedTypeName] = useState(
    type ? (isKnownLocationType ? type.name : CUSTOM_TYPE) : ''
  );
  const [customTypeName, setCustomTypeName] = useState(
    type && !isKnownLocationType ? type.name : ''
  );
  const [initialItemName, setInitialItemName] = useState('');
  const [parentItemId, setParentItemId] = useState(defaultParentId ?? '0');
  const [parentItems, setParentItems] = useState<LookupItem[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchingParentItems = parentItems.filter((item) =>
    `${item.name} ${item.type}`.toLowerCase().includes(parentSearch.trim().toLowerCase())
  );
  const selectedParentItem = parentItems.find((item) => item.id === parentItemId);
  const visibleParentItems =
    selectedParentItem && !matchingParentItems.some((item) => item.id === selectedParentItem.id)
      ? [selectedParentItem, ...matchingParentItems]
      : matchingParentItems;

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
      setError('Choose a first option name different from the lookup type.');
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
            <label htmlFor="lookup-type-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Lookup type <span className="text-red-500">*</span>
            </label>
            <select
              id="lookup-type-name"
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
              <>
                <label htmlFor="custom-lookup-type-name" className="mt-3 block text-sm font-medium text-gray-700 mb-1.5">
                  Custom type name <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-lookup-type-name"
                  type="text"
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  required
                  disabled={!!type}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="For example, Occupations"
                />
              </>
            )}
            <p className="mt-1.5 text-xs leading-5 text-gray-500">
              Choose a suggested type or create a custom one. For Sudan locations, start with
              SudanStates, then add City and LocalArea. The type name cannot be changed later.
            </p>
          </div>

          {!type && (
            <div>
              <label htmlFor="first-lookup-option" className="block text-sm font-medium text-gray-700 mb-1.5">
                First option name <span className="text-red-500">*</span>
              </label>
              <input
                id="first-lookup-option"
                type="text"
                value={initialItemName}
                onChange={(e) => setInitialItemName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                required
                placeholder="For example, Doctor"
              />
              <p className="mt-1.5 text-xs leading-5 text-gray-500">
                Enter the first option people will see in this list. You can add more after saving.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="lookup-type-parent" className="block text-sm font-medium text-gray-700 mb-1.5">
              Parent item <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <label htmlFor="parent-item-search" className="sr-only">
                Search parent items
              </label>
              <input
                id="parent-item-search"
                type="search"
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                placeholder="Search parent items..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
              {parentSearch && (
                <button
                  type="button"
                  onClick={() => setParentSearch('')}
                  aria-label="Clear parent item search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              id="lookup-type-parent"
              value={parentItemId}
              onChange={(e) => setParentItemId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            >
              <option value="0">None (top-level item)</option>
              {visibleParentItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
            {parentSearch.trim() && matchingParentItems.length === 0 && (
              <p className="mt-1.5 text-xs text-gray-500">No parent items match that search.</p>
            )}
            <p className="mt-1.5 text-xs leading-5 text-gray-500">
              Use a parent only when this option belongs under another item, such as a city in a
              state. Otherwise, leave it set to None.
            </p>
          </div>

          {!type && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-900">What happens next</p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                Saving creates this list and its first option. Open the list afterward to add more
                options.
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
