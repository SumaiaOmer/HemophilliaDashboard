import React, { useState, useEffect } from 'react';
import { Plus, Check, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { RolesService } from '../../services/roles';
import { ScreensService, ScreenTreeNode } from '../../services/screens';
import { UsersService } from '../../services/users';

interface ExpandedRole {
  roleId: number;
  expandedType: 'screens' | 'users' | null;
}

interface ExpandedParent {
  roleId: number;
  parentId: number;
}

interface Screen {
  id: number;
  code: string;
  name: string;
  displayName?: string;
  parentId?: number;
  children?: Screen[];
}

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email?: string;
  state?: string;
}

interface UserRole {
  id: number;
  name: string;
}

export const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenTree, setScreenTree] = useState<ScreenTreeNode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<ExpandedRole[]>([]);
  const [expandedParents, setExpandedParents] = useState<ExpandedParent[]>([]);
  const [selectedScreensByRole, setSelectedScreensByRole] = useState<Record<number, number[]>>({});
  const [selectedUsersByRole, setSelectedUsersByRole] = useState<Record<number, number[]>>({});
  const [userRoles, setUserRoles] = useState<Record<number, UserRole[]>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesData, screensData, screenTreeData, usersData] = await Promise.all([
        RolesService.getAllRoles().catch(err => {
          console.error('Failed to fetch roles:', err);
          return [];
        }),
        ScreensService.getAllScreens().catch(err => {
          console.error('Failed to fetch screens:', err);
          return [];
        }),
        ScreensService.getMyScreens().catch(err => {
          console.error('Failed to fetch screen tree:', err);
          return [];
        }),
        UsersService.getAllUsers().catch(err => {
          console.error('Failed to fetch users:', err);
          return [];
        }),
      ]);

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setScreens(Array.isArray(screensData) ? screensData : []);
      setScreenTree(Array.isArray(screenTreeData) ? screenTreeData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);

      const userRolesMap: Record<number, UserRole[]> = {};
      const validUsers = Array.isArray(usersData) ? usersData : [];

      for (const user of validUsers) {
        try {
          const roles = await UsersService.getUserRoles(user.id);
          userRolesMap[user.id] = Array.isArray(roles) ? roles : [];
        } catch (err) {
          console.error(`Failed to fetch roles for user ${user.id}:`, err);
          userRolesMap[user.id] = [];
        }
      }
      setUserRoles(userRolesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      setCreatingRole(true);
      await RolesService.createRole(newRoleName);
      setNewRoleName('');
      await loadInitialData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setCreatingRole(false);
    }
  };

  const toggleRoleExpand = (roleId: number, type: 'screens' | 'users') => {
    setExpandedRoles(prev => {
      const existing = prev.find(r => r.roleId === roleId);
      if (existing) {
        if (existing.expandedType === type) {
          return prev.filter(r => r.roleId !== roleId);
        } else {
          return prev.map(r => r.roleId === roleId ? { ...r, expandedType: type } : r);
        }
      }
      return [...prev, { roleId, expandedType: type }];
    });
  };

  const toggleParentExpand = (roleId: number, parentId: number) => {
    setExpandedParents(prev => {
      const existing = prev.find(p => p.roleId === roleId && p.parentId === parentId);
      if (existing) {
        return prev.filter(p => !(p.roleId === roleId && p.parentId === parentId));
      }
      return [...prev, { roleId, parentId }];
    });
  };

  const isParentExpanded = (roleId: number, parentId: number) => {
    return expandedParents.some(p => p.roleId === roleId && p.parentId === parentId);
  };

  const handleScreenToggle = (roleId: number, screenId: number) => {
    setSelectedScreensByRole(prev => ({
      ...prev,
      [roleId]: prev[roleId]?.includes(screenId)
        ? prev[roleId].filter(id => id !== screenId)
        : [...(prev[roleId] || []), screenId],
    }));
  };

  const handleParentToggle = (roleId: number, parent: ScreenTreeNode) => {
    const selectedScreens = selectedScreensByRole[roleId] || [];
    const childIds = parent.children?.map(c => c.id) || [];
    const allChildrenSelected = childIds.every(id => selectedScreens.includes(id));

    if (allChildrenSelected) {
      setSelectedScreensByRole(prev => ({
        ...prev,
        [roleId]: selectedScreens.filter(id => !childIds.includes(id) && id !== parent.id),
      }));
    } else {
      const newSelected = [...selectedScreens.filter(id => !childIds.includes(id) && id !== parent.id), parent.id, ...childIds];
      setSelectedScreensByRole(prev => ({
        ...prev,
        [roleId]: [...new Set(newSelected)],
      }));
    }
  };

  const handleAssignScreens = async (roleId: number) => {
    const screenIds = selectedScreensByRole[roleId] || [];
    if (screenIds.length === 0) return;

    try {
      await RolesService.assignScreensToRole(roleId, screenIds);
      setSelectedScreensByRole(prev => ({ ...prev, [roleId]: [] }));
      await loadInitialData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign screens');
    }
  };

  const handleAssignUser = async (roleId: number, userId: number) => {
    try {
      await RolesService.assignUserToRole(roleId, userId);
      setSelectedUsersByRole(prev => ({ ...prev, [roleId]: [] }));
      await loadInitialData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Role</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Enter role name"
            className="flex-1 px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateRole()}
          />
          <button
            onClick={handleCreateRole}
            disabled={creatingRole || !newRoleName.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {roles.map((role) => {
          const expanded = expandedRoles.find(r => r.roleId === role.id);
          const selectedScreens = selectedScreensByRole[role.id] || [];

          return (
            <div key={role.id} className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{role.name}</h4>
                    <p className="text-sm text-gray-500">Role ID: {role.id}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => toggleRoleExpand(role.id, 'screens')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700">Assign Screens</span>
                    {expanded?.expandedType === 'screens' ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {expanded?.expandedType === 'screens' && (
                    <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="mb-3 text-sm text-gray-600 font-medium">
                        Select parent screens (main) and their child screens (sub) below:
                      </div>
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {screenTree.map((parent) => {
                          const hasChildren = parent.children && parent.children.length > 0;
                          const isExpanded = isParentExpanded(role.id, parent.id);
                          const childIds = parent.children?.map(c => c.id) || [];
                          const allChildrenSelected = childIds.length > 0 && childIds.every(id => selectedScreens.includes(id));
                          const someChildrenSelected = childIds.some(id => selectedScreens.includes(id));
                          const parentSelected = selectedScreens.includes(parent.id);

                          return (
                            <div key={parent.id} className="border border-red-200 rounded-lg bg-white">
                              <div className="flex items-center gap-2 p-3">
                                {hasChildren && (
                                  <button
                                    onClick={() => toggleParentExpand(role.id, parent.id)}
                                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <ChevronRight
                                      className={`h-4 w-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    />
                                  </button>
                                )}
                                {!hasChildren && <div className="w-6" />}

                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={hasChildren ? (allChildrenSelected && parentSelected) : parentSelected}
                                    ref={(el) => {
                                      if (el && hasChildren) {
                                        el.indeterminate = someChildrenSelected && !allChildrenSelected;
                                      }
                                    }}
                                    onChange={() => {
                                      if (hasChildren) {
                                        handleParentToggle(role.id, parent);
                                      } else {
                                        handleScreenToggle(role.id, parent.id);
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-red-600"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-800">
                                        {parent.displayName || parent.name}
                                      </span>
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                        Parent
                                      </span>
                                      {hasChildren && (
                                        <span className="text-xs text-gray-500">
                                          ({parent.children.length} sub)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {parent.code}
                                    </div>
                                  </div>
                                </label>
                              </div>

                              {hasChildren && isExpanded && (
                                <div className="border-t border-red-200 bg-red-50 px-3 py-2">
                                  <div className="space-y-1">
                                    {parent.children.map((child) => (
                                      <label
                                        key={child.id}
                                        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors ml-6"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedScreens.includes(child.id)}
                                          onChange={() => handleScreenToggle(role.id, child.id)}
                                          className="w-4 h-4 rounded border-red-300 text-red-600"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700">
                                              {child.displayName || child.name}
                                            </span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                              Child
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            {child.code}
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {selectedScreens.length > 0 && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                          <div className="text-sm text-gray-600 mb-2">
                            Selected: <span className="font-semibold text-gray-800">{selectedScreens.length}</span> screen{selectedScreens.length !== 1 ? 's' : ''}
                          </div>
                          <button
                            onClick={() => handleAssignScreens(role.id)}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Assign {selectedScreens.length} Screen{selectedScreens.length !== 1 ? 's' : ''} to {role.name}
                          </button>
                        </div>
                      )}

                      {selectedScreens.length === 0 && (
                        <div className="mt-3 text-center py-4 text-gray-500 text-sm">
                          Select parent and child screens to assign to this role
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleRoleExpand(role.id, 'users')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700">Assign Users</span>
                    {expanded?.expandedType === 'users' ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {expanded?.expandedType === 'users' && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {users.map((user) => {
                          const hasRole = userRoles[user.id]?.some(r => r.name === role.name);
                          return (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800">{user.username}</div>
                                <div className="text-xs text-gray-500">{user.email || user.state}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasRole ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    <Check className="h-3 w-3" /> Assigned
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleAssignUser(role.id, user.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                  >
                                    Assign
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-red-200">
          <p className="text-gray-500">No roles created yet. Create one to get started.</p>
        </div>
      )}
    </div>
  );
};
