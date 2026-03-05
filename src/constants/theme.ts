export const colors = {
  primary: '#1E40AF',        // deep blue
  primaryLight: '#DBEAFE',   // light blue
  primaryDark: '#1E3A8A',    // navy
  accent: '#0891B2',         // teal
  background: '#F0F4F8',     // cool gray
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
  // KYC status colors
  statusDraft: '#9CA3AF',
  statusInProgress: '#F59E0B',
  statusVerified: '#10B981',
  statusFlagged: '#F97316',
  statusRejected: '#DC2626',
  // Risk level colors
  riskLow: '#10B981',
  riskMedium: '#F59E0B',
  riskHigh: '#F97316',
  riskCritical: '#DC2626',
  // Sidebar
  sidebarBg: '#1E293B',
  sidebarText: '#CBD5E1',
  sidebarActiveText: '#FFFFFF',
  sidebarActiveBg: '#1E40AF',
  sidebarDivider: '#334155',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const font = {
  sizeXs: 11,
  sizeSm: 13,
  sizeMd: 15,
  sizeLg: 17,
  sizeXl: 20,
  sizeXxl: 24,
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,
};
