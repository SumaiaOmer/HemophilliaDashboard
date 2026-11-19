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
  static async getMyScreens(): Promise<ScreenTreeNode[]> {
    try {
      const response = await apiClient.get<any>('/screens/my-screens');

      let screens = response;
      if (response && response.data) {
        screens = response.data;
      }

      if (!Array.isArray(screens)) {
        return [];
      }

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

      return screens.map(screen => processScreen(screen));
    } catch (error) {
      console.error('Error fetching my screens:', error);
      return [];
    }
  }

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
      console.error('Error in getAllScreens:', error);
      return [];
    }
  }
}
