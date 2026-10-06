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
  Layers,
  List,
} from 'lucide-react';
import {
  LookupItem,
  LookupItemRequest,
  LookupType,
  LookupsService,
} from '../../services/lookups';
import { AuthService } from '../../services/auth';
import { LookupTypeForm } from './LookupTypeForm';
import { LookupItemForm } from './LookupItemForm';

interface ViewMode {
  kind: 'items' | 'types';
  typeKey?: string;
}

export const LookupsManager: React.FC = () => {
  const [allTypes, setAllTypes] = useState<LookupType[]>([]);
  const [allItems, setAllItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>({ kind: 'types' });
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});

  // Form state
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<LookupType | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [defaultItemType, setDefaultItemType] = useState<string | undefined>(undefined);

  const isAdmin = useMemo(() => {
    const user = AuthService.getCurrentUser();
    return user?.role?.toLowerCase() === 'admin';
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [types, items] = await Promise.all([
        LookupsService.getAllTypes(),
        LookupsService.getAll(),
      ]);
      setAllTypes(types);
      setAllItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lookup data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---- Type CRUD (via API: root items where Name === Type) ----

  const handleSaveType = async (typeName: string, parentTypeId: string | null) => {
    if (editingType) {
      if (editingType.rootItemId) {
        await LookupsService.update(editingType.rootItemId, {
          name: editingType.name,
          type: editingType.name,
          parentId: '0',
        });
      }
    } else {
      // Create a root item: Name = Type = typeName, ParentId = 0 (top-level)
      await LookupsService.create({
        name: typeName,
        type: typeName,
        parentId: '0',
      });
    }
    await loadAll();
    setShowTypeForm(false);
    setEditingType(null);
  };

  const handleDeleteType = async (type: LookupType) => {
    const childItems = allItems.filter((i) => i.type === type.name && i.id !== type.rootItemId);
    const subTypes = allTypes.filter((t) => t.parentType === type.name);
    const msg =
      childItems.length > 0 || subTypes.length > 0
        ? `Delete type "${type.label}"? It has ${childItems.length} item(s) and ${subTypes.length} sub-type(s). All will remain in the API unless deleted individually.`
        : `Delete type "${type.label}"?`;
    if (!window.confirm(msg)) return;
    try {
      if (type.rootItemId) {
        await LookupsService.remove(type.rootItemId);
      }
      await loadAll();
      if (view.typeKey === type.name) setView({ kind: 'types' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lookup type');
    }
  };

  // ---- Item CRUD (API) ----

  const handleSaveItem = async (itemData: LookupItemRequest) => {
    if (editingItem) {
      await LookupsService.update(editingItem.id, itemData);
    } else {
      await LookupsService.create(itemData);
    }
    await loadAll();
    setShowItemForm(false);
    setEditingItem(null);
    setDefaultItemType(undefined);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await LookupsService.remove(id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lookup item');
    }
  };

  // ---- Derived data ----

  const typeMap = useMemo(() => {
    const m = new Map<string, LookupType>();
    allTypes.forEach((t) => m.set(t.name, t));
    return m;
  }, [allTypes]);

  // Build a tree of types (parent -> children)
  const typeTree = useMemo(() => {
    const roots: LookupType[] = [];
    const childrenMap = new Map<string, LookupType[]>();
    allTypes.forEach((t) => {
      if (t.parentType && typeMap.has(t.parentType)) {
        const arr = childrenMap.get(t.parentType) ?? [];
        arr.push(t);
        childrenMap.set(t.parentType, arr);
      } else {
        roots.push(t);
      }
    });
    roots.sort((a, b) => a.label.localeCompare(b.label));
    childrenMap.forEach((arr) => arr.sort((a, b) => a.label.localeCompare(b.label)));
    return { roots, childrenMap };
  }, [allTypes, typeMap]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((item) => {
      // Don't count the root item (where Name === Type) in the count
      if (item.name.toLowerCase() !== item.type.toLowerCase()) {
        counts[item.type] = (counts[item.type] || 0) + 1;
      }
    });
    return counts;
  }, [allItems]);

  // Filtered items for the items view (exclude root items)
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allItems.filter((item) => {
      if (item.name.toLowerCase() === item.type.toLowerCase()) return false; // skip root
      if (view.typeKey && item.type !== view.typeKey) return false;
      if (!term) return true;
      return item.name.toLowerCase().includes(term);
    });
  }, [allItems, searchTerm, view.typeKey]);

  // Filtered type tree for the types view (search by label/name)
  const filteredTypeTree = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return typeTree;

    const filterTypes = (types: LookupType[]): LookupType[] => {
      return types
        .filter((t) => {
          const children = typeTree.childrenMap.get(t.name) ?? [];
          const matchesSelf = t.label.toLowerCase().includes(term) || t.name.toLowerCase().includes(term);
          const matchingChildren = filterTypes(children);
          return matchesSelf || matchingChildren.length > 0;
        });
    };

    const filteredRoots = filterTypes(typeTree.roots);
    return { roots: filteredRoots, childrenMap: typeTree.childrenMap };
  }, [typeTree, searchTerm]);

  // Auto-expand all types when searching so matching children are visible
  const searchedExpandedTypes = useMemo(() => {
    if (!searchTerm.trim()) return collapsedTypes;
    const expanded: Record<string, boolean> = {};
    const collectAll = (types: LookupType[]) => {
      types.forEach((t) => {
        const children = typeTree.childrenMap.get(t.name) ?? [];
        if (children.length > 0) {
          expanded[t.name] = true;
          collectAll(children);
        }
      });
    };
    collectAll(filteredTypeTree.roots);
    return expanded;
  }, [searchTerm, filteredTypeTree, typeTree.childrenMap, collapsedTypes]);

  const toggleType = (key: string) => {
    setCollapsedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const dismissError = () => setError(null);

  // Recursively render type nodes
  const renderTypeNode = (type: LookupType, level: number): React.ReactNode => {
    const children = typeTree.childrenMap.get(type.name) ?? [];
    const collapsed = searchedExpandedTypes[type.name];
    const hasChildren = children.length > 0;
    const isActive = view.kind === 'items' && view.typeKey === type.name;

    const paddingLeft = level === 0 ? 20 : 20 + level * 24;

    return (
      <div key={type.name}>
        <div
          className="flex items-center justify-between py-3 hover:bg-gray-50/80 transition-colors duration-150 border-b border-gray-50"
          style={{ paddingLeft, paddingRight: 20 }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleType(type.name)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0" />
            )}
            <button
              onClick={() => setView({ kind: 'items', typeKey: type.name })}
              className={`flex items-center gap-2 text-left flex-1 min-w-0 ${
                isActive ? 'text-red-600 font-semibold' : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <Layers className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
              <span className="truncate text-sm">{type.label}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {itemCounts[type.name] || 0}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => {
                setEditingType(type);
                setShowTypeForm(true);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Edit type parent"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDeleteType(type)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete type"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {hasChildren && !collapsed && (
          <div className="bg-gray-50/30">
            {children.map((child) => renderTypeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
          <p className="text-gray-500 mt-1">Only administrators can manage lookups.</p>
        </div>
      </div>
    );
  }

  // ---- Items View ----
  if (view.kind === 'items' && view.typeKey) {
    const currentType = typeMap.get(view.typeKey);
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <button
              onClick={() => setView({ kind: 'types' })}
              className="text-sm text-red-600 hover:text-red-700 mb-1 flex items-center gap-1"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to Types
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {currentType?.label ?? view.typeKey} — Items
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} in this type
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setDefaultItemType(view.typeKey);
              setShowItemForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Item</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={dismissError} className="text-red-500 hover:text-red-700 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Inbox className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No items found</p>
            <button
              onClick={() => {
                setEditingItem(null);
                setDefaultItemType(view.typeKey);
                setShowItemForm(true);
              }}
              className="mt-4 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add your first item
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="group hover:bg-red-50/40 transition-colors duration-150">
                      <td className="px-6 py-3.5 text-sm text-gray-900">
                        <span className="block truncate max-w-xs">{item.name}</span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowItemForm(true);
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
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
        )}

        {showItemForm && (
          <LookupItemForm
            item={editingItem}
            defaultType={defaultItemType}
            availableTypes={allTypes}
            onSave={handleSaveItem}
            onCancel={() => {
              setShowItemForm(false);
              setEditingItem(null);
              setDefaultItemType(undefined);
            }}
          />
        )}
      </div>
    );
  }

  // ---- Types View (default) ----
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lookup Management</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Create lookup types first, then add items under each type
          </p>
        </div>
        <button
          onClick={() => {
            setEditingType(null);
            setShowTypeForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Lookup Type</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={dismissError} className="text-red-500 hover:text-red-700 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search types…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          {allTypes.length} type{allTypes.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <List className="h-4 w-4" />
          {allItems.filter((i) => i.name.toLowerCase() !== i.type.toLowerCase()).length} item{allItems.filter((i) => i.name.toLowerCase() !== i.type.toLowerCase()).length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredTypeTree.roots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No lookup types found</p>
          <p className="text-sm text-gray-400 mt-1">Create a type to start adding items</p>
          <button
            onClick={() => {
              setEditingType(null);
              setShowTypeForm(true);
            }}
            className="mt-4 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            Add your first lookup type
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredTypeTree.roots.map((type) => renderTypeNode(type, 0))}
        </div>
      )}

      {showTypeForm && (
        <LookupTypeForm
          type={editingType}
          existingTypeNames={allTypes.map((t) => t.name)}
          onSave={handleSaveType}
          onCancel={() => {
            setShowTypeForm(false);
            setEditingType(null);
          }}
        />
      )}

      {showItemForm && (
        <LookupItemForm
          item={editingItem}
          defaultType={defaultItemType}
          availableTypes={allTypes}
          onSave={handleSaveItem}
          onCancel={() => {
            setShowItemForm(false);
            setEditingItem(null);
            setDefaultItemType(undefined);
          }}
        />
      )}
    </div>
  );
};
