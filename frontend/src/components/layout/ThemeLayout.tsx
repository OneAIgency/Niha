import { useLocation, Outlet } from 'react-router-dom';
import {
  Palette,
  Layers,
  Type,
  Square,
  Table2,
  AlertCircle,
  Loader2,
  Box,
} from 'lucide-react';
import { Subheader, SubheaderNavButton } from '../common';

// Theme section navigation
export const THEME_SECTIONS = [
  { id: 'layout', label: 'Page Layout', icon: Layers },
  { id: 'containers', label: 'Containers', icon: Box },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'buttons', label: 'Buttons', icon: Square },
  { id: 'inputs', label: 'Inputs', icon: Square },
  { id: 'badges', label: 'Badges', icon: Layers },
  { id: 'tabs', label: 'Tabs & Toggles', icon: Layers },
  { id: 'cards', label: 'Cards', icon: Square },
  { id: 'tables', label: 'Tables', icon: Table2 },
  { id: 'feedback', label: 'Feedback', icon: AlertCircle },
  { id: 'loading', label: 'Loading', icon: Loader2 },
] as const;

/**
 * Layout for /theme subpages. Renders Subheader with nav buttons and Outlet for nested route content.
 */
export function ThemeLayout() {
  const { pathname } = useLocation();

  // Get active section from pathname (e.g., /theme/colors -> colors)
  const pathParts = pathname.split('/');
  const activeSection = pathParts[pathParts.length - 1] || 'layout';

  return (
    <div className="min-h-screen bg-navy-900">
      <Subheader
        icon={<Palette className="w-5 h-5 text-amber-500" />}
        title="Theme"
        description="Design system showcase"
        iconBg="bg-amber-500/20"
      >
        {/* Navigation buttons */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide" aria-label="Theme navigation">
          {THEME_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <SubheaderNavButton
                key={section.id}
                to={`/theme/${section.id}`}
                label={section.label}
                icon={<Icon className="w-4 h-4" />}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </Subheader>
      <div className="page-container py-8">
        <Outlet />
      </div>
    </div>
  );
}
