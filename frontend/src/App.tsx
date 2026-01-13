import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  ContactPage,
  LoginPage,
  CashMarketPage,
  CeaCashMarketPage,
  SwapPage,
  CeaSwapMarketPage,
  HowItWorksPage,
  DashboardPage,
  ProfilePage,
  SettingsPage,
  UsersPage,
  BackofficePage,
  SetupPasswordPage,
  Onboarding1Page,
  LearnMorePage,
  OnboardingIndexPage,
  MarketOverviewPage,
  AboutNihaoPage,
  CeaHoldersPage,
  EuaHoldersPage,
  EuEntitiesPage,
  StrategicAdvantagePage,
} from './pages';
import { useAuthStore } from './stores/useStore';
import type { UserRole } from './types';

// Protected Route wrapper - requires authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Role-based Route wrapper - requires specific roles
function RoleProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}) {
  const { isAuthenticated, user } = useAuthStore();

  // Debug logging
  console.log('RoleProtectedRoute check:', { isAuthenticated, userRole: user?.role, allowedRoles, redirectTo });

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    console.log('Role check failed:', { user, hasRole: user?.role, includes: user ? allowedRoles.includes(user.role) : false });
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// Admin-only Route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['ADMIN']} redirectTo="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
}

// Onboarding Route - temporarily allowing all for testing
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  // Temporarily disabled for testing - uncomment below for production
  // const { isAuthenticated, user } = useAuthStore();
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
  // if (user?.role !== 'PENDING') {
  //   return <Navigate to="/dashboard" replace />;
  // }
  return <>{children}</>;
}

// Route for funded/approved users with dashboard access
function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Pending users go to onboarding
  if (user?.role === 'PENDING') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
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
          <Route path="/how-it-works" element={<HowItWorksPage />} />

          {/* Protected - All authenticated users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected - Approved, Funded, Admin (dashboard access) */}
          <Route
            path="/dashboard"
            element={
              <DashboardRoute>
                <DashboardPage />
              </DashboardRoute>
            }
          />
          <Route
            path="/cash-market"
            element={
              <DashboardRoute>
                <CeaCashMarketPage />
              </DashboardRoute>
            }
          />
          <Route
            path="/cash-market-old"
            element={
              <DashboardRoute>
                <CashMarketPage />
              </DashboardRoute>
            }
          />
          <Route
            path="/swap"
            element={
              <DashboardRoute>
                <CeaSwapMarketPage />
              </DashboardRoute>
            }
          />
          <Route
            path="/swap-old"
            element={
              <DashboardRoute>
                <SwapPage />
              </DashboardRoute>
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
          <Route
            path="/backoffice"
            element={
              <AdminRoute>
                <BackofficePage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Auth routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<LoginPage />} />
        <Route path="/setup-password" element={<SetupPasswordPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
