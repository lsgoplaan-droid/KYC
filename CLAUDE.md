# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**KYC Partner** is an Expo (React Native) app for B2B partner verification with full due diligence. It uses Companies House UK for company lookups and OpenSanctions for sanctions/PEP screening, with Supabase as the backend. Targets iOS, Android, and web.

## Development Commands

```bash
npm start              # Start Expo dev server
npm run android        # Build and run on Android
npm run ios            # Run on iOS simulator (macOS only)
npm run web            # Start web version in browser
```

There are no configured test or lint scripts. TypeScript strict mode is the primary type safety layer.

## Environment Setup

Set these environment variables in `.env.local`:
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `EXPO_PUBLIC_COMPANIES_HOUSE_API_KEY` — Companies House API key (register at developer.company-information.service.gov.uk)
- `EXPO_PUBLIC_OPENSANCTIONS_API_KEY` — OpenSanctions API key (free for non-commercial)

Run `supabase-schema.sql` in the Supabase SQL Editor to create all tables. Create a Storage bucket named `kyc-documents`.

## Architecture

### Navigation & Layout (`app/`)
File-based routing via Expo Router with a **sidebar + Stack** layout (no tabs).

**Root layout** (`app/_layout.tsx`):
- **Web (≥768px)**: Persistent dark sidebar + Stack navigator side by side
- **Mobile (<768px)**: Full-width Stack + animated slide-in drawer (hamburger button in dashboard header)
- Provides `SidebarContext` for child screens to open/close the mobile drawer
- Stack header shown on all screens except index (dashboard has its own inline header)

**Screens** (all in `app/`):
- `index.tsx` — Dashboard: inline header bar (hamburger on mobile + search), KPI stat cards, filter chips, partner list with pull-to-refresh, floating action button (FAB)
- `add-partner.tsx` — 8-step KYC wizard (Company → Verify → Credit → UBOs → Screening → Docs → Risk → Decision) with back navigation and multi-jurisdiction support (UK, Singapore, India)
- `settings.tsx` — API key management
- `partner/[id].tsx` — Partner detail with full KYC report, actions, audit log

### Sidebar (`src/components/Sidebar.tsx`)
Dark-themed navigation panel (#1E293B). Contains app branding, nav items with active route highlighting via `usePathname()`, and a "Recent Partners" section (last 5 partners with StatusBadge). Takes `onClose` callback for mobile drawer dismiss.

### Responsive Layout (`src/hooks/useResponsiveLayout.ts`)
Detects wide screen (web ≥768px) vs mobile via `Dimensions` API. Returns `isWideScreen`, `sidebarWidth` (240), `contentWidth`. Components like KpiCards and the root layout adapt based on this.

### KYC Workflow (Add Partner Wizard)
1. Select jurisdiction (UK, Singapore, India) + search or enter company details
2. Verify company details from search results
3. Credit check (UK only — filing history + charges via Companies House)
4. Auto-fetches officers/directors (UK only) → add/edit UBOs manually
5. Run sanctions/PEP screening on company + all UBOs via OpenSanctions
6. Upload documents (incorporation, address proof, ID, financial)
7. Auto-calculated risk score (0-100) with 6 weighted factors
8. Decision: approve (verified), flag for review, or reject

**Multi-jurisdiction support:**
- **UK**: Companies House API for search, officers, and credit data
- **Singapore**: ACRA data via data.gov.sg (free, no auth needed)
- **India**: Manual entry (MCA has no free public API)

### Services (`src/services/`)
- `companyService.ts` — UK company lookups via Companies House API. Basic auth, searches companies and retrieves officers/directors.
- `companyServiceSg.ts` — Singapore company lookups via data.gov.sg ACRA dataset. No auth required.
- `creditService.ts` — UK credit checking via Companies House filing history and charges endpoints. Returns filing compliance and outstanding charges data.
- `sanctionsService.ts` — OpenSanctions API screening for companies and persons. `screenPartnerFull()` screens company + all UBOs and saves results.
- `riskService.ts` — Pure scoring algorithm (no API calls). Weighted factors: company age (15), status (15), credit health (10), sanctions (30), UBO verification (15), documents (15). Risk levels: 0-25=low, 26-50=medium, 51-75=high, 76-100=critical.
- `partnerService.ts` — Supabase CRUD for partners, UBOs, screenings, documents, risk assessments, audit log.
- `documentService.ts` — Supabase Storage upload/delete + metadata management.

### Hooks (`src/hooks/`)
- `usePartners` — Partner list with refresh
- `usePartnerDetail(id)` — Full partner data (partner, UBOs, screenings, documents, risk, audit log)
- `useCompanyLookup` — Multi-jurisdiction company search + officer fetching (dispatches to UK/SG/IN)
- `useCreditCheck` — UK credit check state (filing history + charges)
- `useSanctionsCheck` — Sanctions screening state
- `useDocuments(partnerId)` — Document CRUD
- `useApiKeys` — Manage Companies House and OpenSanctions API keys
- `useResponsiveLayout` — Wide screen detection for sidebar vs drawer layout

### UI Components (`src/components/`)
- `Sidebar` — Dark navigation panel with nav items and recent partners
- `KpiCards` — Dashboard stat cards (total, pending, flagged, verified) — row on web, horizontal scroll on mobile
- `SearchBar` — Text input for filtering partners by company name
- `StatusBadge` — Color-coded KYC status chip
- `RiskIndicator` — Risk level dot + label with score
- `FilterChips` — Horizontal scrollable filter chips
- `StepIndicator` — Wizard progress bar with step dots
- `LoadingOverlay` — Full-screen loading spinner

### Contexts (`src/contexts/`)
- `SidebarContext` — Provides `openDrawer()`, `closeDrawer()`, `isWideScreen` for mobile drawer control from child screens

### Storage (`src/storage/apiKeyStore.ts`)
Platform-aware secure storage: `expo-secure-store` on native, `localStorage` on web. Supports bundled keys via `EXPO_PUBLIC_*` env vars.

### Design System (`src/constants/theme.ts`)
Professional blue/gray palette. All spacing, typography, and border radius values are centralized — use these tokens rather than inline values.

### Types (`src/types/index.ts`)
All shared TypeScript interfaces: `Partner`, `PartnerUbo`, `ScreeningResult`, `PartnerDocument`, `RiskAssessment`, `RiskFactor`, `CompanyLookupResult`, `OfficerInfo`, `AuditLogEntry`, `CreditCheckResult`, `FilingHistorySummary`, `ChargesSummary`, plus `KycStatus`, `RiskLevel`, `Jurisdiction`, `JurisdictionCode` types and create DTOs.

### Database (`supabase-schema.sql`)
Six tables: `partners`, `partner_ubos`, `screening_results`, `partner_documents`, `risk_assessments`, `audit_log`. All have RLS enabled with permissive dev policies.

## Key Conventions
- All environment variables exposed to the app must be prefixed `EXPO_PUBLIC_`
- Platform differences are handled inside `apiKeyStore.ts`, not at call sites
- Company API responses are normalized into `CompanyLookupResult` regardless of source
- Risk scoring is pure logic in `riskService.ts` — no API calls, deterministic
- Audit log entries are automatically created by `partnerService` for status changes and UBO modifications
