import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, Activity, ChevronDown } from 'lucide-react';
import { AuthService } from '../services/auth';
import { ScreensService, ScreenTreeNode } from '../services/screens';
import { getIcon } from '../lib/iconMap';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  user?: { id?: number; name: string; email: string; role: string } | null;
  onLogout?: () => void;
}

// Helper functions
const normalize = (s?: string): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

const nodeContainsActive = (node: ScreenTreeNode, activeSection?: string): boolean => {
  if (!activeSection) return false;
  
  const activeNorm = normalize(activeSection);
  const nodeRoute = normalize(node.route || node.code || node.name);
  
  if (nodeRoute === activeNorm) return true;
  
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => nodeContainsActive(child, activeSection));
  }
  
  return false;
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  user,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<number, boolean>>({});
  const [menuItems, setMenuItems] = useState<ScreenTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load user-specific screens from /api/screens/my-screens
  useEffect(() => {
    const loadMyScreens = async () => {
      if (!user) {
        setMenuItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('📱 Loading role-based screens for user:', user);
        
        const screens = await ScreensService.getMyScreens();
        console.log('✅ Role-based screens loaded:', screens);
        
        if (!screens || screens.length === 0) {
          setError('No menu items available for your role');
          setMenuItems([]);
          setLoading(false);
          return;
        }
        
        setMenuItems(screens);
        
        // Auto-expand menus that contain the active section
        const autoExpanded: Record<number, boolean> = {};
        const expandParentsOfActive = (items: ScreenTreeNode[], parentIds: number[] = []) => {
          items.forEach(item => {
            const currentPath = [...parentIds, item.id];
            
            if (nodeContainsActive(item, activeSection)) {
              currentPath.forEach(id => {
                autoExpanded[id] = true;
              });
            }
            
            if (item.children && item.children.length > 0) {
              expandParentsOfActive(item.children, currentPath);
            }
          });
        };
        
        expandParentsOfActive(screens);
        
        // Also expand default menus
        const expandDefaultParents = (items: ScreenTreeNode[]) => {
          items.forEach(item => {
            if (item.code === 'PATIENT' || item.code === 'DISTRIBUTION') {
              autoExpanded[item.id] = true;
            }
            if (item.children && item.children.length > 0) {
              expandDefaultParents(item.children);
            }
          });
        };
        expandDefaultParents(screens);
        
        setExpandedMenus(autoExpanded);
        
      } catch (error) {
        console.error('Error loading screens:', error);
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    loadMyScreens();
  }, [user, activeSection]);

  const handleLogout = async () => {
    if (onLogout) {
      await AuthService.logout();
      onLogout();
    }
  };

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setSidebarOpen(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter menu items based on search term (including children)
  const filterMenuItems = (items: ScreenTreeNode[], term: string): ScreenTreeNode[] => {
    if (!term) return items;
    
    return items.reduce((acc: ScreenTreeNode[], item) => {
      const matchesName = item.name.toLowerCase().includes(term.toLowerCase());
      const matchesDisplayName = item.displayName?.toLowerCase().includes(term.toLowerCase());
      
      let filteredChildren: ScreenTreeNode[] = [];
      if (item.children) {
        filteredChildren = filterMenuItems(item.children, term);
      }
      
      if (matchesName || matchesDisplayName || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children
        });
      }
      
      return acc;
    }, []);
  };
  
  const filteredMenuItems = filterMenuItems(menuItems, searchTerm);

  // Render menu item recursively with dynamic child support
  const renderMenuItem = (item: ScreenTreeNode, level: number = 0) => {
    const Icon = getIcon(item.icon);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id] || false;
    
    const itemRoute = normalize(item.route || item.code || item.name);
    const isActive = normalize(activeSection) === itemRoute;
    const descendantActive = !isActive && nodeContainsActive(item, activeSection);

    // Dynamic padding based on nesting level
    const getPadding = () => {
      if (level === 0) return 'px-6 py-3';
      if (level === 1) return 'pl-10 pr-6 py-2';
      if (level === 2) return 'pl-14 pr-6 py-2';
      return `pl-${16 + (level - 2) * 4} pr-6 py-2`;
    };

    // Dynamic text size for deeper levels
    const getTextSize = () => {
      if (level === 0) return 'text-sm font-medium';
      if (level === 1) return 'text-sm';
      return 'text-xs';
    };

    // Dynamic icon size based on level
    const getIconSize = () => {
      if (level === 0) return 'h-5 w-5';
      if (level === 1) return 'h-4 w-4';
      return 'h-3.5 w-3.5';
    };

    const handleClick = () => {
      if (hasChildren) {
        toggleExpand(item.id);
      } else {
        handleSectionChange(itemRoute);
      }
    };

    return (
      <div key={item.id}>
        <button
          onClick={handleClick}
          className={`
            w-full flex items-center justify-between ${getPadding()} 
            ${getTextSize()} transition-colors duration-200
            ${isActive && !hasChildren
              ? 'text-red-600 bg-red-100 border-r-2 border-red-600'
              : isActive || (hasChildren && descendantActive)
              ? 'text-red-600 bg-red-50'
              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }
          `}
          aria-expanded={hasChildren ? isExpanded : undefined}
          role={hasChildren ? "menuitem" : "link"}
        >
          <div className="flex items-center min-w-0 flex-1">
            {Icon && (
              <Icon className={`${getIconSize()} mr-3 flex-shrink-0`} />
            )}
            <span className="truncate">
              {item.displayName || item.name}
              {item.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </span>
          </div>
          {hasChildren && (
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ml-2 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="bg-gray-50/50">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get page title dynamically from menu structure
  const getPageTitle = (): string => {
    if (!activeSection) return 'Dashboard';
    
    const findTitle = (items: ScreenTreeNode[]): string | null => {
      for (const item of items) {
        const itemRoute = normalize(item.route || item.code || item.name);
        if (itemRoute === normalize(activeSection)) {
          return item.displayName || item.name || activeSection;
        }
        if (item.children) {
          const found = findTitle(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const title = findTitle(menuItems);
    if (title) return title;

    return activeSection
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold text-gray-800">HemoCore</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search bar for filtering menus including children */}
        <div className="px-4 py-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-4 px-6">
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Retry
              </button>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center text-gray-500 py-4 px-6">
              <p className="text-sm">No menu items found</p>
            </div>
          ) : (
            filteredMenuItems.map((item) => renderMenuItem(item, 0))
          )}
        </nav>

        {/* User Info and Logout */}
        {user && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role || 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <h1 className="text-2xl font-semibold text-gray-800">
              {getPageTitle()}
            </h1>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden md:block text-sm text-gray-600">
                  Welcome, {user.name}
                </div>
              )}
              <div className="text-sm text-gray-600">
                Hemophilia Management System
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};