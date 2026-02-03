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
  Globe,
  Building2,
  Factory,
  TrendingUp,
  FileText,
  Home,
  Target,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { onboardingApi } from '@/services/api';
import { Header } from '@/components/layout';
import { Subheader, SubheaderNavButton } from '@/components/common';
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
  /** When true, only renders the content without header/footer/nav - for embedding in other pages */
  embedded?: boolean;
}

export default function OnboardingLayout({
  children,
  title,
  subtitle,
  embedded = false,
}: OnboardingLayoutProps) {
  const { user } = useAuthStore();
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
    <div className="min-h-screen bg-navy-900 pt-16 md:pt-20">
      {/* Main Header - consistent with rest of app */}
      <Header />

      {/* Subheader with navigation - consistent with theme */}
      <Subheader
        icon={<BookOpen className="w-5 h-5 text-teal-400" />}
        title="Onboarding"
        description="Learn about Nihao Group and the Carbon Market"
        iconBg="bg-teal-500/20"
      >
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide" aria-label="Onboarding navigation">
          {navItems.map((nav) => {
            const Icon = nav.icon;
            const isActive = location.pathname === nav.path;
            return (
              <SubheaderNavButton
                key={nav.path}
                to={nav.path}
                label={nav.label}
                icon={<Icon className="w-4 h-4" />}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </Subheader>

      {/* Page Title */}
      {title && (
        <div className="page-container pt-8 pb-4">
          <h2 className="text-4xl font-extrabold text-white mb-2">{title}</h2>
          {subtitle && (
            <p className="text-lg text-navy-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="page-container py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-navy-700">
        <p className="font-semibold text-navy-400">
          Nihao Group Hong Kong | Carbon Market Intermediation | January 2026
        </p>
        <p className="text-sm mt-2 text-navy-500">
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
