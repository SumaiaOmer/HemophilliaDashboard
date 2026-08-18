import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CreditCard as Edit,
  Trash2,
  Database,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';
import { LookupItem, LookupItemRequest, LookupsService, LOOKUP_TYPES } from '../../services/lookups';
import { AuthService } from '../../services/auth';
import { LookupForm } from './LookupForm';

export const LookupsManager: React.FC = () => {
  const [allItems, setAllItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [defaultType, setDefaultType] = useState<string | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const isAdmin = useMemo(() => {
    const user = AuthService.getCurrentUser();
    return user?.role?.toLowerCase() === 'admin';
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
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
  };

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

  const typeLabel = (type: string) =>
    LOOKUP_TYPES.find((t) => t.value === type)?.label ?? type;

  const filteredItems = allItems.filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      typeLabel(item.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group items by type for a cleaner overview when no type filter is applied
  const groupedItems = useMemo(() => {
    if (typeFilter !== 'all') return null;
    const groups: Record<string, LookupItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredItems, typeFilter]);

  const hasActiveFilters = searchTerm || typeFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Access Restricted</p>
          <p className="text-gray-600">Only administrators can manage lookup items.</p>
        </div>
      </div>
    );
  }

  const renderTable = (items: LookupItem[], showTypeColumn: boolean) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              {showTypeColumn && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                {showTypeColumn && (
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {typeLabel(item.type)}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lookup Management</h2>
          <p className="text-gray-600">Manage dropdown options used across the system</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Lookup Item</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div className="relative md:w-64">
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
            >
              <option value="all">All Types</option>
              {LOOKUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredItems.length} of {allItems.length} items
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No lookup items found</p>
          {hasActiveFilters && (
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          )}
        </div>
      ) : groupedItems ? (
        <div className="space-y-6">
          {groupedItems.map(([type, items]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">{typeLabel(type)}</h3>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
              {renderTable(items, false)}
            </div>
          ))}
        </div>
      ) : (
        renderTable(filteredItems, true)
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
        </div>
      )}
    </div>
  );
};
