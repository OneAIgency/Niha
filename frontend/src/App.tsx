import React, { Component, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout, ThemeLayout } from './components/layout';
import { AutoOrdersService, MmActivityFloater, RoleSimulationFloater } from './components/admin';
import { ThemeTokenOverridesStyle } from './components/theme/ThemeTokenOverridesStyle';
import { useAuthStore } from './stores/useStore';
import type { UserRole } from './types';
import { getPostLoginRedirect } from './utils/redirect';
import { getEffectiveRole } from './utils/effectiveRole';
import { logger } from './utils/logger';

/**
 * Error boundary for backoffice routes. Surfaces render errors in UI instead of a blank page
 * and logs them via logger.error (with componentStack) for debugging and monitoring.
 */
class BackofficeErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[BackofficeErrorBoundary]', { error, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-8">
          <div className="max-w-xl w-full bg-navy-800 border border-navy-700 rounded-xl p-6 text-white">
            <h1 className="text-xl font-bold text-red-400 mb-2">Backoffice error</h1>
            <p className="text-navy-300 text-sm font-mono break-all">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Code splitting: Lazy load pages with DIRECT imports (not barrel) for true code splitting
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const CashMarketProPage = lazy(() => import('./pages/CashMarketProPage').then(m => ({ default: m.CashMarketProPage })));
const CeaSwapMarketPage = lazy(() => import('./pages/CeaSwapMarketPage').then(m => ({ default: m.CeaSwapMarketPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const FundingPage = lazy(() => import('./pages/FundingPage').then(m => ({ default: m.FundingPage })));
const SetupPasswordPage = lazy(() => import('./pages/SetupPasswordPage').then(m => ({ default: m.SetupPasswordPage })));
const Onboarding1Page = lazy(() => import('./pages/Onboarding1Page'));
const LearnMorePage = lazy(() => import('./pages/LearnMorePage').then(m => ({ default: m.LearnMorePage })));
const OnboardingIndexPage = lazy(() => import('./pages/onboarding/OnboardingIndexPage'));
const MarketOverviewPage = lazy(() => import('./pages/onboarding/MarketOverviewPage'));
const AboutNihaoPage = lazy(() => import('./pages/onboarding/AboutNihaoPage'));
const CeaHoldersPage = lazy(() => import('./pages/onboarding/CeaHoldersPage'));
const EuaHoldersPage = lazy(() => import('./pages/onboarding/EuaHoldersPage'));
const EuEntitiesPage = lazy(() => import('./pages/onboarding/EuEntitiesPage'));
const StrategicAdvantagePage = lazy(() => import('./pages/onboarding/StrategicAdvantagePage'));
const ComponentShowcasePage = lazy(() => import('./pages/ComponentShowcasePage').then(m => ({ default: m.ComponentShowcasePage })));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage').then(m => ({ default: m.DesignSystemPage })));
const ThemeSectionPage = lazy(() => import('./pages/ThemeSectionPage').then(m => ({ default: m.ThemeSectionPage })));
const MarketMakersPage = lazy(() => import('./pages/MarketMakersPage').then(m => ({ default: m.MarketMakersPage })));
const LoggingPage = lazy(() => import('./pages/LoggingPage'));
const BackofficeOnboardingPage = lazy(() => import('./pages/BackofficeOnboardingPage').then(m => ({ default: m.BackofficeOnboardingPage })));
const FeeSettingsPage = lazy(() => import('./pages/FeeSettingsPage').then(m => ({ default: m.FeeSettingsPage })));
const AutoTradePage = lazy(() => import('./pages/AutoTradePage').then(m => ({ default: m.AutoTradePage })));

// Loading fallback component with proper semantic structure for accessibility
const PageLoader = () => (
  <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-navy-600 dark:text-navy-400">Loading...</p>
      </div>
    </main>
  </div>
);

/**
 * AuthGuard - Single source of truth for authentication redirects
 *
 * CRITICAL: This component handles ALL auth-based redirects to prevent loops.
 * Do NOT add redirect logic elsewhere (LoginPage, individual routes, etc.)
 * Order: authentication → allowedRoles → blockRoles.
 *
 * ADMIN SUPERUSER: ADMIN role bypasses all role checks and has access to everything.
 */
function AuthGuard({
  children,
  requireAuth,
  allowedRoles,
  redirectTo,
  blockRoles,
  redirectWhenBlocked = '/onboarding',
}: {
  children: React.ReactNode;
  requireAuth: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  blockRoles?: UserRole[];
  redirectWhenBlocked?: string;
}) {
  const { isAuthenticated, user, simulatedRole, _hasHydrated } = useAuthStore();
  const location = useLocation();
  const effectiveRole = getEffectiveRole(user, simulatedRole);

  // CRITICAL: Wait for Zustand to rehydrate before making any decisions
  // This prevents the flash/loop where auth state is temporarily undefined
  if (!_hasHydrated) {
    return <PageLoader />;
  }

  // Route requires authentication
  if (requireAuth) {
    if (!isAuthenticated || !user) {
      // Not authenticated - redirect to login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // Rejected users have no access (use effective role so admin simulating REJECTED goes to login)
    if (effectiveRole === 'REJECTED') {
      return <Navigate to="/login" replace />;
    }

    // ADMIN with no simulation: bypass role checks (full access). With simulation we use effectiveRole below.
    if (user.role === 'ADMIN' && simulatedRole == null) {
      return <>{children}</>;
    }

    // Check role-based access (allowed roles) using effective role
    if (allowedRoles && effectiveRole != null && !allowedRoles.includes(effectiveRole)) {
      const target = redirectTo ?? getPostLoginRedirect({ ...user, role: effectiveRole });
      return <Navigate to={target} replace />;
    }

    // Block specific roles (e.g. NDA) and redirect to onboarding
    if (blockRoles && effectiveRole != null && blockRoles.includes(effectiveRole)) {
      return <Navigate to={redirectWhenBlocked} replace />;
    }

    // Authenticated and authorized
    return <>{children}</>;
  }

  // Route does NOT require auth (like /login)
  // If user is already authenticated, redirect them away (using effective role for target)
  if (isAuthenticated && user) {
    const roleForRedirect = effectiveRole ?? user.role;
    const targetPath = getPostLoginRedirect({ ...user, role: roleForRedirect });
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  return <>{children}</>;
}

// Convenience wrappers using AuthGuard

/** Protects routes for authenticated non-NDA users; NDA redirects to /onboarding. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} blockRoles={['NDA']} redirectWhenBlocked="/onboarding">
      {children}
    </AuthGuard>
  );
}

function LoginRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  );
}

/**
 * Restricts route to allowed roles. When user is not in allowedRoles, redirects to
 * redirectTo if provided, otherwise getPostLoginRedirect(user) (role-based one-hop redirect).
 */
function RoleProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={allowedRoles} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['ADMIN']} redirectTo="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
}

/** Onboarding documentation: NDA, KYC, and all post-KYC users (for re-reading mechanism docs). */
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['NDA', 'KYC', 'APPROVED', 'FUNDING', 'AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA']}>
      {children}
    </RoleProtectedRoute>
  );
}

/** Funding page: APPROVED and FUNDING only (pre-submission), or ADMIN, or MM. */
function ApprovedRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['APPROVED', 'FUNDING', 'ADMIN', 'MM']}>
      {children}
    </RoleProtectedRoute>
  );
}

/** Cash market (CEA purchase): CEA only (pre-purchase), or ADMIN, or MM. CEA_SETTLE and beyond use /swap. */
function FundedRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute
      allowedRoles={['CEA', 'ADMIN', 'MM']}
      redirectTo="/swap"
    >
      {children}
    </RoleProtectedRoute>
  );
}

/** Dashboard: AML, CEA and above (funded users with market access), ADMIN, or MM. AML has dashboard access but no funding. */
function DashboardRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']}>
      {children}
    </RoleProtectedRoute>
  );
}

/** Catch-all: redirect authenticated users to their home (by effective role), others to login. */
function CatchAllRedirect() {
  const { isAuthenticated, user, simulatedRole, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return <PageLoader />;
  }

  const effectiveRole = getEffectiveRole(user, simulatedRole);
  const roleForRedirect = effectiveRole ?? user?.role;
  const target = isAuthenticated && user && roleForRedirect
    ? getPostLoginRedirect({ ...user, role: roleForRedirect })
    : '/login';
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeTokenOverridesStyle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Onboarding - new multi-page onboarding hub */}
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <OnboardingIndexPage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding/market-overview"
            element={
              <OnboardingRoute>
                <MarketOverviewPage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding/about-nihao"
            element={
              <OnboardingRoute>
                <AboutNihaoPage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding/cea-holders"
            element={
              <OnboardingRoute>
                <CeaHoldersPage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding/eua-holders"
            element={
              <OnboardingRoute>
                <EuaHoldersPage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding/eu-entities"
            element={
              <OnboardingRoute>
                <EuEntitiesPage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding/strategic-advantage"
            element={
              <OnboardingRoute>
                <StrategicAdvantagePage />
              </OnboardingRoute>
            }
          />

          {/* Onboarding1 - EUA-CEA swap analysis page (legacy) */}
          <Route
            path="/onboarding1"
            element={
              <OnboardingRoute>
                <Onboarding1Page />
              </OnboardingRoute>
            }
          />

          {/* Learn More - standalone page for onboarding users */}
          <Route
            path="/learn-more"
            element={
              <OnboardingRoute>
                <LearnMorePage />
              </OnboardingRoute>
            }
          />

          {/* Public routes with layout */}
          <Route element={<Layout />}>
            <Route path="/contact" element={<ContactPage />} />

            {/* Cash Market — same layout as Swap: Layout provides Header + main.pt-20 */}
            <Route
              path="/cash-market"
              element={
                <FundedRoute>
                  <CashMarketProPage />
                </FundedRoute>
              }
            />

            {/* Protected - All authenticated users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* APPROVED users - Funding page only */}
            <Route
              path="/funding"
              element={
                <ApprovedRoute>
                  <FundingPage />
                </ApprovedRoute>
              }
            />

            {/* Protected - Funded, Admin (dashboard access) */}
            <Route
              path="/dashboard"
              element={
                <DashboardRoute>
                  <DashboardPage />
                </DashboardRoute>
              }
            />
            {/* Legacy: redirect to main cash market */}
            <Route path="/cash-market-pro" element={<Navigate to="/cash-market" replace />} />
            {/* Swap Center: SWAP, EUA_SETTLE, EUA, ADMIN */}
            <Route
              path="/swap"
              element={
                <RoleProtectedRoute allowedRoles={['CEA', 'CEA_SETTLE', 'SWAP', 'ADMIN', 'MM']}>
                  <CeaSwapMarketPage />
                </RoleProtectedRoute>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <SettingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/auto-trade"
              element={
                <AdminRoute>
                  <AutoTradePage />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/fee-settings"
              element={
                <AdminRoute>
                  <FeeSettingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />

            {/* Component Showcase - Design System Reference */}
            <Route
              path="/components"
              element={
                <ProtectedRoute>
                  <ComponentShowcasePage />
                </ProtectedRoute>
              }
            />

            {/* Design System - Comprehensive Token & Component Reference */}
            <Route
              path="/design-system"
              element={
                <ProtectedRoute>
                  <DesignSystemPage />
                </ProtectedRoute>
              }
            />

            {/* Theme - Admin only design system showcase with subpages */}
            <Route
              path="/theme"
              element={
                <AdminRoute>
                  <ThemeLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="layout" replace />} />
              <Route path=":section" element={<ThemeSectionPage />} />
            </Route>

            {/* Backoffice routes - same Layout (Header + Footer) as rest of site */}
            <Route
              path="/backoffice"
              element={<Navigate to="/backoffice/onboarding" replace />}
            />
            <Route
              path="/backoffice/onboarding"
              element={<Navigate to="/backoffice/onboarding/requests" replace />}
            />
            <Route
              path="/backoffice/onboarding/requests"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <BackofficeOnboardingPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/onboarding/kyc"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <BackofficeOnboardingPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/onboarding/deposits"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <BackofficeOnboardingPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/onboarding/aml"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <BackofficeOnboardingPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/onboarding/settlements"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <BackofficeOnboardingPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/market-makers"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <MarketMakersPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/logging"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <LoggingPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
          </Route>

          {/* Auth routes (no layout) */}
          <Route
            path="/login"
            element={
              <LoginRoute>
                <LoginPage />
              </LoginRoute>
            }
          />
          <Route
            path="/auth/verify"
            element={
              <LoginRoute>
                <LoginPage />
              </LoginRoute>
            }
          />
          <Route path="/setup-password" element={<SetupPasswordPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<CatchAllRedirect />} />
        </Routes>
        <AutoOrdersService />
        <MmActivityFloater />
        <RoleSimulationFloater />
      </Suspense>
    </Router>
  );
}

export default App;
