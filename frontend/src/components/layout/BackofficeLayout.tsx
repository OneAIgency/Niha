import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Users,
  Activity,
  Bot,
  ShoppingCart,
  ArrowRightLeft,
  Zap,
} from 'lucide-react';
import { Subheader, SubSubHeader } from '../common';
import { cn } from '../../utils';

type BackofficeRoute = '/backoffice' | '/backoffice/market-makers' | '/backoffice/market-orders' | '/backoffice/order-book' | '/backoffice/liquidity' | '/backoffice/logging' | '/users';

interface RouteConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description: string;
}

/**
 * Checks if a pathname matches a route, supporting both exact matches and nested routes.
 * For example, '/backoffice/market-makers' matches '/backoffice/market-makers' and '/backoffice/market-makers/123'
 */
function isRouteActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  // Check if pathname is a nested route (e.g., /backoffice/market-makers/123)
  return pathname.startsWith(route + '/');
}

const ROUTE_CONFIG: Record<BackofficeRoute, RouteConfig> = {
  '/backoffice': {
    icon: FileText,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    description: 'Review access requests, KYC documents, and user activity',
  },
  '/backoffice/market-makers': {
    icon: Bot,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
    description: 'Manage MM clients and assets',
  },
  '/backoffice/market-orders': {
    icon: ShoppingCart,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    description: 'Place orders for MM clients',
  },
  '/backoffice/order-book': {
    icon: ArrowRightLeft,
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-500',
    description: 'View order book & place MM orders',
  },
  '/backoffice/liquidity': {
    icon: Zap,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    description: 'Create liquidity',
  },
  '/backoffice/logging': {
    icon: Activity,
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-500',
    description: 'View comprehensive audit trail',
  },
  '/users': {
    icon: Users,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    description: 'Manage platform users',
  },
};

const BACKOFFICE_NAV = [
  { to: '/backoffice/market-makers', label: 'Market Makers', icon: Bot },
  { to: '/backoffice/market-orders', label: 'Market Orders', icon: ShoppingCart },
  { to: '/backoffice/order-book', label: 'Order Book', icon: ArrowRightLeft },
  { to: '/backoffice/liquidity', label: 'Liquidity', icon: Zap },
  { to: '/backoffice/logging', label: 'Audit Logging', icon: Activity },
  { to: '/users', label: 'Users', icon: Users },
] as const;

/**
 * Props for BackofficeLayout component
 */
interface BackofficeLayoutProps {
  /** Main page content */
  children: ReactNode;
  /** Optional left-aligned content in SubSubHeader (e.g. CEA|EUA toggle, filters) */
  subSubHeaderLeft?: ReactNode;
  /** Optional right-aligned content in SubSubHeader (action buttons, refresh, etc.) */
  subSubHeader?: ReactNode;
}

/**
 * BackofficeLayout Component
 *
 * Shared layout for all backoffice pages providing:
 * - Consistent Subheader with route-based icon and description
 * - Compact navigation buttons in Subheader
 * - Optional SubSubHeader for page-specific content (filters, actions)
 * - Standardized content container
 *
 * @example
 * ```tsx
 * <BackofficeLayout
 *   subSubHeaderLeft={<CEAToggle />}
 *   subSubHeader={<Button>Refresh</Button>}
 * >
 *   <PageContent />
 * </BackofficeLayout>
 * ```
 */
export function BackofficeLayout({ children, subSubHeaderLeft, subSubHeader }: BackofficeLayoutProps) {
  const { pathname } = useLocation();
  // Get route configuration, fallback to main backoffice page
  const config = (ROUTE_CONFIG[pathname as BackofficeRoute] ?? ROUTE_CONFIG['/backoffice']) as RouteConfig;
  const IconComponent = config.icon;
  // Only show SubSubHeader if at least one prop is provided
  const showSubSub = Boolean(subSubHeaderLeft) || Boolean(subSubHeader);

  return (
    <div className="min-h-screen bg-navy-950">
      <Subheader
        icon={<IconComponent className={cn('w-5 h-5', config.iconColor)} />}
        title="Backoffice"
        description={config.description}
        iconBg={config.iconBg}
      >
        <nav className="flex items-center gap-2" aria-label="Backoffice navigation">
          {BACKOFFICE_NAV.map((item) => {
            const isActive = isRouteActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-navy-600 text-white'
                    : 'text-navy-400 hover:bg-navy-700 hover:text-navy-300'
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Subheader>
      {showSubSub && (
        <SubSubHeader left={subSubHeaderLeft}>{subSubHeader}</SubSubHeader>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
