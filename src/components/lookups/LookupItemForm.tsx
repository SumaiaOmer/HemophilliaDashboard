import React, { useState, useEffect } from 'react';
import { Tag, X } from 'lucide-react';
import { LookupItem, LookupItemRequest, LookupType, LookupsService } from '../../services/lookups';

interface LookupItemFormProps {
  item?: LookupItem | null;
  defaultType?: string;
  defaultParentId?: string;
  availableTypes: LookupType[];
  onSave: (item: LookupItemRequest) => Promise<void>;
  onCancel: () => void;
}

export const LookupItemForm: React.FC<LookupItemFormProps> = ({
  item,
  defaultType,
  defaultParentId,
  availableTypes,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(item?.name ?? '');
  const [typeKey, setTypeKey] = useState<string>(item?.type ?? defaultType ?? '');
  const [parentId, setParentId] = useState<string>(item?.parentId ?? defaultParentId ?? '0');
  const [parentItems, setParentItems] = useState<LookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = availableTypes.find((t) => t.name === typeKey);
  const parentTypeName = selectedType?.parentType ?? null;
  const parentTypeLabel =
    availableTypes.find((t) => t.name === parentTypeName)?.label ?? parentTypeName;

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

  // Parent options come from the selected type's parent type
  useEffect(() => {
    if (parentTypeName) {
      LookupsService.getByType(parentTypeName)
        .then((items) => setParentItems(items.filter((i) => i.name.toLowerCase() !== i.type.toLowerCase())))
        .catch(() => setParentItems([]));
    } else {
      setParentItems([]);
    }
  }, [parentTypeName]);

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
        parentId: parentId || '0',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lookup item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lookup-item-form-title"
        className="mx-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 id="lookup-item-form-title" className="text-lg font-semibold text-gray-900">
                {item ? 'Edit lookup option' : 'Add lookup option'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a lookup type, then enter the option used in dropdowns.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close form"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="text-sm text-red-700 flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <label htmlFor="lookup-type" className="mb-1.5 block text-sm font-medium text-gray-800">
              Lookup type <span className="text-red-500">*</span>
            </label>
            <select
              id="lookup-type"
              value={typeKey}
              onChange={(e) => {
                setTypeKey(e.target.value);
                setParentId('0');
              }}
              required
              disabled={!!item}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">Choose a lookup type</option>
              {availableTypes.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label}
                </option>
              ))}
            </select>
            {item && (
              <p className="mt-1.5 text-xs text-gray-500">The type cannot be changed after creation.</p>
            )}
            {availableTypes.length === 0 && (
              <p className="mt-1.5 text-xs text-red-600">No lookup types found. Create a type first.</p>
            )}
          </div>

          <div>
            <label htmlFor="lookup-option-name" className="mb-1.5 block text-sm font-medium text-gray-800">
              Option name <span className="text-red-500">*</span>
            </label>
            <input
              id="lookup-option-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              placeholder="e.g. Outpatient"
            />
            <p className="mt-1.5 text-xs leading-5 text-gray-500">
              Sent as <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-700">name</code>. To use a different stored value and display label, enter <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-700">value|Label</code> (for example, <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-700">center_visit|Center Visit</code>).
            </p>
          </div>

          <div>
            <label htmlFor="lookup-parent" className="mb-1.5 block text-sm font-medium text-gray-800">
              Parent item <span className="font-normal text-gray-500">(optional)</span>{' '}
              {parentTypeLabel && (
                <span className="font-normal text-gray-500">from {parentTypeLabel}</span>
              )}
            </label>
            <select
              id="lookup-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={!parentTypeName}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="0">None (top-level item)</option>
              {parentItems.map((pi) => (
                <option key={pi.id} value={pi.id}>
                  {pi.name} (ID: {pi.id})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-5 text-gray-500">
              {parentTypeName
                ? 'Sent as parentId. Choose None for a top-level option.'
                : 'This lookup has no parent type; parentId will be 0.'}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">API request and response</p>
            <p className="mt-1.5 text-xs leading-5 text-blue-800">
              The request sends <code>name</code>, <code>type</code>, and <code>parentId</code> to <code>POST /api/Lookups</code>. The API returns the saved lookup item.
            </p>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !typeKey}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
