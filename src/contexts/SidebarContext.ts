import { createContext, useContext } from 'react';

interface SidebarContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  isWideScreen: boolean;
}

export const SidebarContext = createContext<SidebarContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isWideScreen: false,
});

export const useSidebar = () => useContext(SidebarContext);
