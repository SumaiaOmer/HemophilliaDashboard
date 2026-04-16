// services/screens.ts
import { apiClient } from '../lib/api';

export interface Screen {
  id: number;
  code: string;
  name: string;
  displayName?: string;
  icon?: string;
  route?: string;
  parentId?: number;
  order?: number;
  children?: Screen[];
}

export interface ScreenTreeNode extends Screen {
  children: ScreenTreeNode[];
}

export class ScreensService {
  // Cache for screen mappings
  private static screenMap: Map<number, Screen> | null = null;
  private static structure = {
    parentChildRelationships: [] as { parentId: number; childId: number }[],
    rootIds: [] as number[]
  };

 // services/screens.ts

static async getMyScreens(): Promise<ScreenTreeNode[]> {
  try {
    console.log('%c🔍 FETCHING MY SCREENS FROM /screens/my-screens', 'background: #3498db; color: white; padding: 4px;');
    
    // ✅ Call the correct endpoint that filters by user role
    const response = await apiClient.get<any>('/screens/my-screens');
    console.log('📦 Response from /screens/my-screens:', JSON.stringify(response, null, 2));
    
    // Handle response format
    let screens = response;
    if (response && response.data) {
      screens = response.data;
    }
    
    if (!Array.isArray(screens)) {
      console.log('❌ Response is not an array');
      return [];
    }

    // Process screens recursively to ensure proper structure
    const processScreen = (screen: any): ScreenTreeNode => {
      return {
        id: screen.id || 0,
        code: screen.code || '',
        name: screen.name || '',
        displayName: screen.displayName || screen.name || '',
        icon: screen.icon || null,
        route: screen.route || '',
        parentId: screen.parentId,
        order: screen.order || 0,
        children: screen.children ? screen.children.map((child: any) => processScreen(child)) : []
      };
    };

    const processedScreens = screens.map(screen => processScreen(screen));
    console.log('✅ Processed role-based screens:', processedScreens);
    
    return processedScreens;
    
  } catch (error) {
    console.error('❌ Error fetching my screens:', error);
    return [];
  }
}

// Keep getAllScreens for admin purposes if needed
 
  /**
   * Build structure dynamically based on naming conventions
   */
  private static buildStructureFromNaming(screens: Screen[]): void {
    // Clear previous structure
    this.structure = {
      parentChildRelationships: [],
      rootIds: []
    };

    // Group screens by potential parent-child relationships
    const screenByCode = new Map<string, Screen>();
    screens.forEach(s => screenByCode.set(s.code, s));

    screens.forEach(screen => {
      // Check if this screen might be a child based on its code
      if (screen.code.includes('_')) {
        // Example: PATIENT_LIST might be child of PATIENT
        const possibleParentCode = screen.code.split('_')[0];
        const parent = screenByCode.get(possibleParentCode);
        
        if (parent) {
          this.structure.parentChildRelationships.push({
            parentId: parent.id,
            childId: screen.id
          });
        } else {
          // If no parent found, treat as root
          this.structure.rootIds.push(screen.id);
        }
      } else {
        // Simple code like PATIENT, DASHBOARD - treat as root
        this.structure.rootIds.push(screen.id);
      }
    });

    // Remove duplicates
    this.structure.rootIds = [...new Set(this.structure.rootIds)];
    
    console.log('📐 Built structure:', this.structure);
  }

  /**
   * Get all screens from API
   */
  static async getAllScreens(): Promise<Screen[]> {
    try {
    const response = await apiClient.get<any>('/screens');
      
      let screens = response;
      if (response && response.data) {
        screens = response.data;
      }
      
      if (!Array.isArray(screens)) {
        return [];
      }

      return screens.map(screen => ({
        id: screen.id || 0,
        code: screen.code || '',
        name: screen.name || '',
        displayName: screen.displayName || screen.name || '',
        icon: screen.icon || null,
        route: screen.route || '',
        order: screen.order || 0
      }));
      
    } catch (error) {
      console.error('❌ Error in getAllScreens:', error);
      return [];
    }
  }

  /**
   * Build tree using structure
   */
  private static buildTreeFromStructure(screenMap: Map<number, Screen>): ScreenTreeNode[] {
    const roots: ScreenTreeNode[] = [];
    
    // Create all nodes
    const nodeMap = new Map<number, ScreenTreeNode>();
    screenMap.forEach((screen, id) => {
      nodeMap.set(id, {
        ...screen,
        children: []
      });
    });

    // Apply parent-child relationships
    this.structure.parentChildRelationships.forEach(rel => {
      const parent = nodeMap.get(rel.parentId);
      const child = nodeMap.get(rel.childId);
      
      if (parent && child) {
        parent.children.push(child);
      }
    });

    // Get root nodes
    this.structure.rootIds.forEach(id => {
      const node = nodeMap.get(id);
      if (node && !this.isChildOfSomeone(node.id)) {
        roots.push(node);
      }
    });

    // Sort by order
    const sortByOrder = (items: ScreenTreeNode[]) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      items.forEach(item => {
        if (item.children.length > 0) {
          sortByOrder(item.children);
        }
      });
    };
    
    sortByOrder(roots);
    
    // Log the final structure
    console.log('📊 FINAL MENU STRUCTURE:');
    roots.forEach(root => {
      console.log(`📁 ${root.displayName} (${root.children.length} children)`);
      root.children.forEach(child => {
        console.log(`  └─ ${child.displayName}`);
      });
    });
    
    return roots;
  }

  /**
   * Check if a screen is a child of someone
   */
  private static isChildOfSomeone(screenId: number): boolean {
    return this.structure.parentChildRelationships.some(rel => rel.childId === screenId);
  }

  /**
   * Get screens for current user (filtered by role)
   */
  static async getMyFilteredScreens(): Promise<ScreenTreeNode[]> {
    try {
      const fullTree = await this.getMyScreens();
      
      const response = await apiClient.get<any>('/screens/my-screens');
      let userScreens = response;
      if (response && response.data) {
        userScreens = response.data;
      }
      
      if (!Array.isArray(userScreens)) {
        return fullTree;
      }

      const accessibleIds = new Set(userScreens.map(s => s.id));
      
      const filterTree = (nodes: ScreenTreeNode[]): ScreenTreeNode[] => {
        return nodes
          .filter(node => accessibleIds.has(node.id))
          .map(node => ({
            ...node,
            children: node.children ? filterTree(node.children) : []
          }));
      };
      
      return filterTree(fullTree);
      
    } catch (error) {
      console.error('Error filtering screens:', error);
      return this.getMyScreens();
    }
  }

  /**
   * Manual override if automatic structure doesn't work
   */
  static setManualStructure(relationships: { parentId: number; childId: number }[], roots: number[]): void {
    this.structure = {
      parentChildRelationships: relationships,
      rootIds: roots
    };
    console.log('📐 Manual structure set:', this.structure);
  }
}