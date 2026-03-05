import { useWindowDimensions, Platform } from 'react-native';

const SIDEBAR_WIDTH = 240;
const BREAKPOINT = 768;

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWideScreen = Platform.OS === 'web' && width >= BREAKPOINT;

  return {
    isWideScreen,
    sidebarWidth: SIDEBAR_WIDTH,
    contentWidth: isWideScreen ? width - SIDEBAR_WIDTH : width,
  };
}
