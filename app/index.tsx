import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { colors, spacing, font, radius } from '../src/constants/theme';
import { usePartners } from '../src/hooks/usePartners';
import { useSidebar } from '../src/contexts/SidebarContext';
import { StatusBadge } from '../src/components/StatusBadge';
import { RiskIndicator } from '../src/components/RiskIndicator';
import { FilterChips } from '../src/components/FilterChips';
import { KpiCards } from '../src/components/KpiCards';
import { SearchBar } from '../src/components/SearchBar';
import type { KycStatus, Partner } from '../src/types';

const STATUS_FILTERS: Array<{ label: string; value: KycStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Verified', value: 'verified' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Rejected', value: 'rejected' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { partners, isLoading, refresh } = usePartners();
  const { openDrawer, isWideScreen } = useSidebar();
  const [activeFilter, setActiveFilter] = useState<KycStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPartners = partners.filter(p => {
    const matchesFilter = activeFilter === 'all' || p.kyc_status === activeFilter;
    const matchesSearch = !searchQuery || p.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderPartner = useCallback(({ item }: { item: Partner }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/partner/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.companyName} numberOfLines={1}>{item.company_name}</Text>
        <StatusBadge status={item.kyc_status} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.regNumber}>{item.registration_number || 'No reg. number'}</Text>
        <Text style={styles.country}>{(item.jurisdiction_code || '').toUpperCase()}</Text>
      </View>
      <View style={styles.cardFooter}>
        {item.risk_level && <RiskIndicator level={item.risk_level} score={item.risk_score} />}
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  ), [router]);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        {!isWideScreen && (
          <TouchableOpacity style={styles.hamburger} onPress={openDrawer}>
            <Text style={styles.hamburgerText}>{'\u2630'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerSearch}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>

      {/* KPI Cards */}
      <KpiCards partners={partners} />

      {/* Filters */}
      <FilterChips
        filters={STATUS_FILTERS}
        activeFilter={activeFilter}
        onSelect={setActiveFilter}
      />

      {/* Partner List */}
      <FlatList
        data={filteredPartners}
        keyExtractor={item => item.id}
        renderItem={renderPartner}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No partners yet</Text>
            <Text style={styles.emptyText}>
              Tap + to add your first partner
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-partner')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  hamburger: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerText: {
    fontSize: 22,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    color: colors.textPrimary,
  },
  headerSearch: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  companyName: {
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  regNumber: {
    fontSize: font.sizeSm,
    color: colors.textSecondary,
  },
  country: {
    fontSize: font.sizeSm,
    color: colors.textSecondary,
    fontWeight: font.weightMedium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: font.sizeXs,
    color: colors.textTertiary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: font.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: font.weightBold,
    lineHeight: 30,
  },
});
