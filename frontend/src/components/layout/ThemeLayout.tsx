import { useLocation, Outlet } from 'react-router-dom';
import { Box, Palette } from 'lucide-react';
import { Subheader, SubheaderNavButton } from '../common';

function isRouteActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  return pathname.startsWith(route + '/');
}

const THEME_NAV = [
  { to: '/theme/sample', label: 'Sample', icon: Palette },
  { to: '/theme/containers', label: 'Containers', icon: Box },
] as const;

/**
 * Layout for /theme subpages. Renders Subheader with nav buttons and Outlet for nested route content.
 */
export function ThemeLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <Subheader
        icon={<Palette className="w-5 h-5 text-amber-500" />}
        title="Theme"
        description="Design system showcase"
        iconBg="bg-amber-500/20"
      >
        <nav className="flex items-center gap-2" aria-label="Theme navigation">
          {THEME_NAV.map((item) => {
            const isActive = isRouteActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <SubheaderNavButton
                key={item.to}
                to={item.to}
                label={item.label}
                icon={<Icon className="w-4 h-4" aria-hidden="true" />}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </Subheader>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}
