/**
 * Wrapper components for embedding onboarding content within FundingPage
 * These components render the onboarding pages without their header/footer
 * and intercept navigation to keep users within FundingPage
 */

import { lazy, Suspense } from 'react';
import { LoadingState } from '@/components/common';
import { EmbeddedProvider, NavigationProvider } from '@/components/onboarding/OnboardingLayout';

// Section key type matching FundingPage
type SectionKey = 'funding' | 'overview' | 'market' | 'about' | 'cea' | 'eua' | 'eu-entities' | 'strategy';

// Lazy load the actual page components
const OnboardingIndexPage = lazy(() => import('../onboarding/OnboardingIndexPage'));
const MarketOverviewPage = lazy(() => import('../onboarding/MarketOverviewPage'));
const AboutNihaoPage = lazy(() => import('../onboarding/AboutNihaoPage'));
const CeaHoldersPage = lazy(() => import('../onboarding/CeaHoldersPage'));
const EuaHoldersPage = lazy(() => import('../onboarding/EuaHoldersPage'));
const EuEntitiesPage = lazy(() => import('../onboarding/EuEntitiesPage'));
const StrategicAdvantagePage = lazy(() => import('../onboarding/StrategicAdvantagePage'));

function ContentLoader() {
  return (
    <div className="py-12">
      <LoadingState variant="spinner" size="lg" text="Loading content..." />
    </div>
  );
}

// Props interface for all embedded components
interface EmbeddedProps {
  onNavigate?: (section: SectionKey) => void;
}

// Wrapper components with navigation support
export function EmbeddedOnboardingIndex({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <OnboardingIndexPage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}

export function EmbeddedMarketOverview({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <MarketOverviewPage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}

export function EmbeddedAboutNihao({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <AboutNihaoPage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}

export function EmbeddedCeaHolders({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <CeaHoldersPage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}

export function EmbeddedEuaHolders({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <EuaHoldersPage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}

export function EmbeddedEuEntities({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <EuEntitiesPage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}

export function EmbeddedStrategicAdvantage({ onNavigate }: EmbeddedProps) {
  const handleNavigate = onNavigate || (() => {});
  return (
    <EmbeddedProvider>
      <NavigationProvider onNavigate={handleNavigate}>
        <Suspense fallback={<ContentLoader />}>
          <StrategicAdvantagePage />
        </Suspense>
      </NavigationProvider>
    </EmbeddedProvider>
  );
}
