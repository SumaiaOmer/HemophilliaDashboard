import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Database,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Inbox,
  Filter,
} from 'lucide-react';
import { LookupItem, LookupItemRequest, LookupsService, LOOKUP_TYPES } from '../../services/lookups';
import { AuthService } from '../../services/auth';
import { LookupForm } from './LookupForm';

const typeLabel = (type: string) =>
  LOOKUP_TYPES.find((t) => t.value === type)?.label ?? type;

export const LookupsManager: React.FC = () => {
  const [allItems, setAllItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [defaultType, setDefaultType] = useState<string | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isAdmin = useMemo(() => {
    const user = AuthService.getCurrentUser();
    return user?.role?.toLowerCase() === 'admin';
  }, []);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LookupsService.getAll();
      setAllItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lookup items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (itemData: LookupItemRequest) => {
    if (editingItem) {
      await LookupsService.update(editingItem.id, itemData);
    } else {
      await LookupsService.create(itemData);
    }
    await loadItems();
    setShowForm(false);
    setEditingItem(null);
    setDefaultType(undefined);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await LookupsService.remove(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lookup item');
    }
  };

  const handleEdit = (item: LookupItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDefaultType(typeFilter !== 'all' ? typeFilter : undefined);
    setShowForm(true);
  };

  const hasActiveFilters = searchTerm.trim() !== '' || typeFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  // Counts per type across ALL items (not filtered) for the type dropdown
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      if (!matchesType) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        typeLabel(item.type).toLowerCase().includes(term)
      );
    });
  }, [allItems, searchTerm, typeFilter]);

  // Group items by type when viewing all types (collapsible sections)
  const groupedItems = useMemo(() => {
    if (typeFilter !== 'all') return null;
    const groups: Record<string, LookupItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredItems, typeFilter]);

  const toggleGroup = (type: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const dismissError = () => setError(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-200 border-t-red-600" />
          <p className="text-sm text-gray-500">Loading lookup data…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Database className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Access Restricted</p>
          <p className="text-gray-500 mt-1">Only administrators can manage lookup items.</p>
        </div>
      </div>
    );
  }

  const renderRow = (item: LookupItem, showType: boolean) => (
    <tr key={item.id} className="group hover:bg-red-50/40 transition-colors duration-150">
      <td className="px-6 py-3.5 text-sm text-gray-900">
        <span className="block truncate max-w-xs">{item.name}</span>
      </td>
      {showType && (
        <td className="px-6 py-3.5 text-sm">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">
            {typeLabel(item.type)}
          </span>
        </td>
      )}
      <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(item)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Edit"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id, item.name)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderTable = (items: LookupItem[], showTypeColumn: boolean) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              {showTypeColumn && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.map((item) => renderRow(item, showTypeColumn))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lookup Management</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Manage dropdown options used across the system
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Lookup Item</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between animate-in">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={dismissError}
            className="text-red-500 hover:text-red-700 p-1 -mt-1 -mr-1"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full appearance-none pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white transition-colors"
            >
              <option value="all">All Types ({allItems.length})</option>
              {LOOKUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} ({typeCounts[t.value] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {hasActiveFilters ? (
              <>Showing {filteredItems.length} of {allItems.length} items</>
            ) : (
              <>{allItems.length} items across {Object.keys(typeCounts).length} types</>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No lookup items found</p>
          {hasActiveFilters ? (
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          ) : (
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add your first lookup item
            </button>
          )}
        </div>
      ) : groupedItems ? (
        <div className="space-y-4">
          {groupedItems.map(([type, items]) => {
            const collapsed = collapsedGroups[type];
            return (
              <div
                key={type}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(type)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors duration-150"
                  aria-expanded={!collapsed}
                >
                  <div className="flex items-center gap-3">
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">{typeLabel(type)}</span>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(null);
                      setDefaultType(type);
                      setShowForm(true);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </button>
                {!collapsed && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-2.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                          {items.map((item) => renderRow(item, false))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        renderTable(filteredItems, true)
      )}

      {/* Form Modal */}
      {showForm && (
        <LookupForm
          item={editingItem}
          defaultType={defaultType}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
            setDefaultType(undefined);
          }}
        />
      )}
    </div>
  );
};
