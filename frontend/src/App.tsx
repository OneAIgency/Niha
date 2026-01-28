import React, { Component, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout';
import { useAuthStore } from './stores/useStore';
import type { UserRole } from './types';
import { getPostLoginRedirect } from './utils/redirect';
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
    logger.error('[BackofficeErrorBoundary]', error, errorInfo.componentStack);
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

// Code splitting: Lazy load pages for better performance
const ContactPage = lazy(() => import('./pages').then(m => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import('./pages').then(m => ({ default: m.LoginPage })));
const CashMarketPage = lazy(() => import('./pages').then(m => ({ default: m.CashMarketPage })));
const CashMarketProPage = lazy(() => import('./pages').then(m => ({ default: m.CashMarketProPage })));
const SwapPage = lazy(() => import('./pages').then(m => ({ default: m.SwapPage })));
const CeaSwapMarketPage = lazy(() => import('./pages').then(m => ({ default: m.CeaSwapMarketPage })));
const DashboardPage = lazy(() => import('./pages').then(m => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('./pages').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./pages').then(m => ({ default: m.UsersPage })));
const FundingPage = lazy(() => import('./pages').then(m => ({ default: m.FundingPage })));
const SetupPasswordPage = lazy(() => import('./pages').then(m => ({ default: m.SetupPasswordPage })));
const Onboarding1Page = lazy(() => import('./pages').then(m => ({ default: m.Onboarding1Page })));
const LearnMorePage = lazy(() => import('./pages').then(m => ({ default: m.LearnMorePage })));
const OnboardingIndexPage = lazy(() => import('./pages').then(m => ({ default: m.OnboardingIndexPage })));
const MarketOverviewPage = lazy(() => import('./pages').then(m => ({ default: m.MarketOverviewPage })));
const AboutNihaoPage = lazy(() => import('./pages').then(m => ({ default: m.AboutNihaoPage })));
const CeaHoldersPage = lazy(() => import('./pages').then(m => ({ default: m.CeaHoldersPage })));
const EuaHoldersPage = lazy(() => import('./pages').then(m => ({ default: m.EuaHoldersPage })));
const EuEntitiesPage = lazy(() => import('./pages').then(m => ({ default: m.EuEntitiesPage })));
const StrategicAdvantagePage = lazy(() => import('./pages').then(m => ({ default: m.StrategicAdvantagePage })));
const ComponentShowcasePage = lazy(() => import('./pages').then(m => ({ default: m.ComponentShowcasePage })));
const DesignSystemPage = lazy(() => import('./pages').then(m => ({ default: m.DesignSystemPage })));
const MarketMakersPage = lazy(() => import('./pages').then(m => ({ default: m.MarketMakersPage })));
const MarketOrdersPage = lazy(() => import('./pages').then(m => ({ default: m.MarketOrdersPage })));
const LoggingPage = lazy(() => import('./pages').then(m => ({ default: m.LoggingPage })));
const CreateLiquidityPage = lazy(() => import('./pages').then(m => ({ default: m.CreateLiquidityPage })));
const BackofficeDepositsPage = lazy(() => import('./pages').then(m => ({ default: m.BackofficeDepositsPage })));
const BackofficeOnboardingPage = lazy(() => import('./pages').then(m => ({ default: m.BackofficeOnboardingPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-navy-50 dark:bg-navy-950">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
      <p className="mt-4 text-navy-600 dark:text-navy-400">Loading...</p>
    </div>
  </div>
);

/**
 * AuthGuard - Single source of truth for authentication redirects
 * 
 * CRITICAL: This component handles ALL auth-based redirects to prevent loops.
 * Do NOT add redirect logic elsewhere (LoginPage, individual routes, etc.)
 */
function AuthGuard({ children, requireAuth, allowedRoles, redirectTo }: {
  children: React.ReactNode;
  requireAuth: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const location = useLocation();

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

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User doesn't have required role - redirect to their appropriate page
      const userRedirect = getPostLoginRedirect(user);
      return <Navigate to={redirectTo || userRedirect} replace />;
    }

    // Authenticated and authorized
    return <>{children}</>;
  }

  // Route does NOT require auth (like /login)
  // If user is already authenticated, redirect them away
  if (isAuthenticated && user) {
    const targetPath = getPostLoginRedirect(user);
    // Don't redirect if already on target path (prevent loops)
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  return <>{children}</>;
}

// Convenience wrappers using AuthGuard

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
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

function RoleProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
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

// Onboarding Route - temporarily allowing all for testing
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function ApprovedRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['APPROVED']} redirectTo="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
}

function FundedRoute({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return <PageLoader />;
  }

  // Special redirects based on role
  if (user?.role === 'PENDING') {
    return <Navigate to="/onboarding" replace />;
  }
  if (user?.role === 'APPROVED') {
    return <Navigate to="/funding" replace />;
  }

  return (
    <RoleProtectedRoute allowedRoles={['FUNDED', 'ADMIN']} redirectTo="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      {children}
    </AuthGuard>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            {/* FUNDED and ADMIN - Cash Market access */}
            <Route
              path="/cash-market"
              element={
                <FundedRoute>
                  <CashMarketPage />
                </FundedRoute>
              }
            />
            {/* Cash Market Pro - Professional Trading Interface */}
            <Route
              path="/cash-market-pro"
              element={
                <FundedRoute>
                  <CashMarketProPage />
                </FundedRoute>
              }
            />
            {/* ADMIN only - Swap Center access */}
            <Route
              path="/swap"
              element={
                <AdminRoute>
                  <CeaSwapMarketPage />
                </AdminRoute>
              }
            />
            <Route
              path="/swap-old"
              element={
                <AdminRoute>
                  <SwapPage />
                </AdminRoute>
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
            <Route path="/design-system" element={<DesignSystemPage />} />

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
              path="/backoffice/market-orders"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <MarketOrdersPage />
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
            <Route
              path="/backoffice/liquidity"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <CreateLiquidityPage />
                  </BackofficeErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/deposits"
              element={
                <AdminRoute>
                  <BackofficeErrorBoundary>
                    <BackofficeDepositsPage />
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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
