import { View, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useRef, useCallback, useMemo } from 'react';
import { colors } from '../src/constants/theme';
import { Sidebar } from '../src/components/Sidebar';
import { useResponsiveLayout } from '../src/hooks/useResponsiveLayout';
import { usePartners } from '../src/hooks/usePartners';
import { SidebarContext } from '../src/contexts/SidebarContext';

export default function RootLayout() {
  const { isWideScreen, sidebarWidth } = useResponsiveLayout();
  const { partners } = usePartners();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [slideAnim]);

  const closeDrawer = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -sidebarWidth,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setDrawerOpen(false));
  }, [slideAnim, sidebarWidth]);

  const sidebarContext = useMemo(() => ({
    openDrawer,
    closeDrawer,
    isWideScreen,
  }), [openDrawer, closeDrawer, isWideScreen]);

  const stackScreens = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add-partner"
        options={{
          headerShown: true,
          title: 'Add Partner',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="partner/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
    </Stack>
  );

  if (isWideScreen) {
    return (
      <SidebarContext.Provider value={sidebarContext}>
        <View style={styles.row}>
          <Sidebar partners={partners} onClose={() => {}} />
          <View style={styles.content}>
            {stackScreens}
          </View>
        </View>
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={sidebarContext}>
      <View style={styles.container}>
        {stackScreens}
        {drawerOpen && (
          <>
            <TouchableOpacity
              style={styles.overlay}
              activeOpacity={1}
              onPress={closeDrawer}
            />
            <Animated.View
              style={[
                styles.drawer,
                {
                  width: sidebarWidth,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Sidebar partners={partners} onClose={closeDrawer} />
            </Animated.View>
          </>
        )}
      </View>
    </SidebarContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
