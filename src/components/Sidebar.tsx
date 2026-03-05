import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors, spacing, font, radius } from '../constants/theme';
import { StatusBadge } from './StatusBadge';
import type { Partner } from '../types';

interface Props {
  partners: Partner[];
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '\u25A6' },
  { label: 'Add Partner', path: '/add-partner', icon: '+' },
  { label: 'Settings', path: '/settings', icon: '\u2699' },
];

export function Sidebar({ partners, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  const handleNav = (path: string) => {
    router.push(path as never);
    onClose();
  };

  const recentPartners = partners.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* App Name */}
      <View style={styles.header}>
        <Text style={styles.appName}>KYC Partner</Text>
        <Text style={styles.appSub}>Due Diligence</Text>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handleNav(item.path)}
              activeOpacity={0.7}
            >
              <Text style={[styles.navIcon, active && styles.navTextActive]}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Recent Partners */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Recent Partners</Text>
        <ScrollView style={styles.recentList}>
          {recentPartners.length === 0 ? (
            <Text style={styles.recentEmpty}>No partners yet</Text>
          ) : (
            recentPartners.map(partner => (
              <TouchableOpacity
                key={partner.id}
                style={styles.recentItem}
                onPress={() => {
                  router.push(`/partner/${partner.id}` as never);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.recentName} numberOfLines={1}>
                  {partner.company_name}
                </Text>
                <StatusBadge status={partner.kyc_status} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sidebarBg,
    width: 240,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  appName: {
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    color: colors.sidebarActiveText,
  },
  appSub: {
    fontSize: font.sizeXs,
    color: colors.sidebarText,
    marginTop: 2,
  },
  nav: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  navItemActive: {
    backgroundColor: colors.sidebarActiveBg,
  },
  navIcon: {
    fontSize: font.sizeLg,
    color: colors.sidebarText,
    width: 24,
    textAlign: 'center',
  },
  navLabel: {
    fontSize: font.sizeMd,
    color: colors.sidebarText,
    fontWeight: font.weightMedium,
  },
  navTextActive: {
    color: colors.sidebarActiveText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sidebarDivider,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  recentTitle: {
    fontSize: font.sizeXs,
    color: colors.sidebarText,
    fontWeight: font.weightSemibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  recentList: {
    flex: 1,
  },
  recentEmpty: {
    fontSize: font.sizeSm,
    color: colors.sidebarDivider,
    fontStyle: 'italic',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  recentName: {
    fontSize: font.sizeSm,
    color: colors.sidebarText,
    flex: 1,
  },
});
