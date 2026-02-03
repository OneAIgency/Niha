import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

// Context for embedded mode - when true, OnboardingLayout renders content only (no header/footer)
const EmbeddedContext = createContext(false);
export const EmbeddedProvider = ({ children }: { children: ReactNode }) => (
  <EmbeddedContext.Provider value={true}>{children}</EmbeddedContext.Provider>
);
export const useEmbedded = () => useContext(EmbeddedContext);

// Navigation context for embedded mode - allows parent to handle navigation
type SectionKey = 'funding' | 'overview' | 'market' | 'about' | 'cea' | 'eua' | 'eu-entities' | 'strategy';
type NavigationHandler = (section: SectionKey) => void;
const NavigationContext = createContext<NavigationHandler | null>(null);
export const NavigationProvider = ({ children, onNavigate }: { children: ReactNode; onNavigate: NavigationHandler }) => (
  <NavigationContext.Provider value={onNavigate}>{children}</NavigationContext.Provider>
);
export const useOnboardingNavigation = () => useContext(NavigationContext);

// Map onboarding paths to section keys
const pathToSection: Record<string, SectionKey> = {
  '/onboarding': 'overview',
  '/onboarding/market-overview': 'market',
  '/onboarding/about-nihao': 'about',
  '/onboarding/cea-holders': 'cea',
  '/onboarding/eua-holders': 'eua',
  '/onboarding/eu-entities': 'eu-entities',
  '/onboarding/strategic-advantage': 'strategy',
};

// Custom Link component that uses navigation context when embedded
interface OnboardingLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function OnboardingLink({ to, children, className, style }: OnboardingLinkProps) {
  const isEmbedded = useEmbedded();
  const onNavigate = useOnboardingNavigation();

  // If embedded and we have a navigation handler, use it
  if (isEmbedded && onNavigate && pathToSection[to]) {
    return (
      <button
        onClick={() => onNavigate(pathToSection[to])}
        className={className}
        style={style}
      >
        {children}
      </button>
    );
  }

  // Otherwise use regular Link
  return (
    <Link to={to} className={className} style={style}>
      {children}
    </Link>
  );
}
import {
  Upload,
  CheckCircle,
  LogOut,
  Globe,
  Building2,
  Factory,
  TrendingUp,
  FileText,
  Home,
  ChevronRight,
  Target,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { onboardingApi } from '@/services/api';
import KycUploadModal from './KycUploadModal';

/* Design-token references (see design-tokens.css --color-onboarding-*) */
// eslint-disable-next-line react-refresh/only-export-components
export const colors = {
  primary: 'var(--color-onboarding-primary)',
  primaryDark: 'var(--color-onboarding-primary-dark)',
  primaryLight: 'var(--color-onboarding-primary-light)',
  secondary: 'var(--color-onboarding-secondary)',
  secondaryLight: 'var(--color-onboarding-secondary-light)',
  accent: 'var(--color-onboarding-accent)',
  danger: 'var(--color-onboarding-danger)',
  success: 'var(--color-onboarding-success)',
  bgDark: 'var(--color-onboarding-bg)',
  bgCard: 'var(--color-onboarding-surface)',
  bgCardHover: 'var(--color-onboarding-surface-hover)',
  textPrimary: 'var(--color-onboarding-text)',
  textSecondary: 'var(--color-onboarding-text-secondary)',
  textMuted: 'var(--color-onboarding-text-muted)',
  border: 'var(--color-onboarding-border)',
};

// Navigation items
const navItems = [
  { path: '/onboarding', label: 'Overview', icon: Home },
  { path: '/onboarding/market-overview', label: 'Market', icon: TrendingUp },
  { path: '/onboarding/about-nihao', label: 'About', icon: Building2 },
  { path: '/onboarding/cea-holders', label: 'CEA', icon: Factory },
  { path: '/onboarding/eua-holders', label: 'EUA', icon: Globe },
  { path: '/onboarding/eu-entities', label: 'EU Entities', icon: FileText },
  { path: '/onboarding/strategic-advantage', label: 'Strategy', icon: Target },
];

interface OnboardingLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
  /** When true, only renders the content without header/footer/nav - for embedding in other pages */
  embedded?: boolean;
}

export default function OnboardingLayout({
  children,
  title,
  subtitle,
  showBreadcrumb = true,
  embedded = false,
}: OnboardingLayoutProps) {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kycProgress, setKycProgress] = useState(0);

  // Check if embedded via context (from EmbeddedProvider)
  const isEmbeddedContext = useEmbedded();
  const isEmbedded = embedded || isEmbeddedContext;

  // Post-KYC users have already completed KYC - hide the KYC button for them
  const POST_KYC_ROLES = ['APPROVED', 'FUNDING', 'AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA'];
  const showKycButton = !POST_KYC_ROLES.includes(user?.role || '');

  // Load KYC progress from API so the floating button shows correct % (not just 0% until modal is opened)
  useEffect(() => {
    let cancelled = false;
    onboardingApi
      .getStatus()
      .then((data) => {
        const uploaded = 'documentsUploaded' in data ? (data as { documentsUploaded: number }).documentsUploaded : data.documents_uploaded;
        const required = 'documentsRequired' in data ? (data as { documentsRequired: number }).documentsRequired : data.documents_required;
        if (!cancelled && required > 0) {
          setKycProgress(Math.round((uploaded / required) * 100));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const currentNavItem = navItems.find(item => item.path === location.pathname);

  // When embedded, only render the content without header/footer/nav
  if (isEmbedded) {
    return (
      <div style={{ backgroundColor: colors.bgDark, color: colors.textPrimary }}>
        {/* Page Title */}
        {title && (
          <div className="max-w-7xl mx-auto px-8 pt-8 pb-4">
            <h2 className="text-4xl font-extrabold mb-2">{title}</h2>
            {subtitle && (
              <p className="text-lg" style={{ color: colors.textSecondary }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bgDark, color: colors.textPrimary }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(13, 148, 136, 0.15) 0%, transparent 100%)',
          borderBottom: `1px solid ${colors.border}`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/onboarding" className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
              >
                N
              </div>
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Nihao Group
                </h1>
                <span className="text-xs uppercase tracking-widest" style={{ color: colors.textSecondary }}>
                  Onboarding
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation */}
            <nav className="hidden xl:flex gap-1 p-1 rounded-xl" style={{ backgroundColor: colors.bgCard }}>
              {navItems.map(nav => {
                const Icon = nav.icon;
                const isActive = location.pathname === nav.path;
                return (
                  <Link
                    key={nav.path}
                    to={nav.path}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      color: isActive ? 'white' : colors.textSecondary,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {nav.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/20"
              style={{ color: colors.danger }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="xl:hidden overflow-x-auto px-4 pb-4">
          <nav className="flex gap-2 min-w-max">
            {navItems.map(nav => {
              const Icon = nav.icon;
              const isActive = location.pathname === nav.path;
              return (
                <Link
                  key={nav.path}
                  to={nav.path}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.bgCard,
                    color: isActive ? 'white' : colors.textSecondary,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {nav.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      {showBreadcrumb && currentNavItem && location.pathname !== '/onboarding' && (
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/onboarding"
              className="hover:underline"
              style={{ color: colors.textSecondary }}
            >
              Onboarding
            </Link>
            <ChevronRight className="w-4 h-4" style={{ color: colors.textMuted }} />
            <span style={{ color: colors.primaryLight }}>{currentNavItem.label}</span>
          </div>
        </div>
      )}

      {/* Page Title */}
      {title && (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-4">
          <h2 className="text-4xl font-extrabold mb-2">{title}</h2>
          {subtitle && (
            <p className="text-lg" style={{ color: colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="text-center py-12"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <p className="font-semibold" style={{ color: colors.textSecondary }}>
          Nihao Group Hong Kong | Carbon Market Intermediation | January 2026
        </p>
        <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
          Bridging the EU ETS and China ETS through innovative bilateral trading solutions
        </p>
      </footer>

      {/* Floating KYC Button - Hidden for APPROVED users (they've already completed KYC) */}
      {showKycButton && (
        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl"
          style={{
            background: kycProgress >= 100
              ? `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`
              : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.danger} 100%)`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={kycProgress < 100 ? {
            boxShadow: [
              '0 0 20px rgba(245, 158, 11, 0.4)',
              '0 0 40px rgba(245, 158, 11, 0.6)',
              '0 0 20px rgba(245, 158, 11, 0.4)',
            ],
          } : {}}
          transition={kycProgress < 100 ? {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        >
          {kycProgress >= 100 ? (
            <CheckCircle className="w-6 h-6 text-white" />
          ) : (
            <Upload className="w-6 h-6 text-white" />
          )}
          <div className="text-white">
            <div className="text-sm font-semibold">
              {kycProgress >= 100 ? 'Documents Complete' : 'Complete KYC'}
            </div>
            <div className="text-xs opacity-90">
              {kycProgress}% uploaded
            </div>
          </div>
          {kycProgress < 100 && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          )}
        </motion.button>
      )}

      {/* KYC Modal - Only rendered when KYC button is visible */}
      {showKycButton && (
        <KycUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProgressChange={setKycProgress}
        />
      )}
    </div>
  );
}
