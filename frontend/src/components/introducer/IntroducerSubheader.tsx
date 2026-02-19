import { Briefcase } from 'lucide-react';
import { cn } from '../../utils';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { NAV_ITEMS } from './constants';
import { ContentDepthSelector } from './ContentDepthSelector';

/**
 * Tab navigation subheader for the Introducer Portal.
 * Click a button to switch the active dashboard tab (no scroll).
 */
export function IntroducerSubheader() {
  const { dashboardTab, setDashboardTab } = useIntroducerStore();

  return (
    <>
      <div className="subheader-bar">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/20">
                <Briefcase className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="section-heading text-white">Introducer Portal</h1>
                <p className="text-sm text-navy-400">Your carbon market knowledge base</p>
              </div>
            </div>

            {/* Right: Tab nav + depth selector + chat button */}
            <div className="flex flex-wrap items-center gap-1">
              {/* Nav pills */}
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = dashboardTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDashboardTab(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'true' : undefined}
                    title={item.label}
                    className={cn(
                      'group subheader-nav-btn',
                      isActive ? 'subheader-nav-btn-active' : 'subheader-nav-btn-inactive'
                    )}
                  >
                    <span className="flex-shrink-0" aria-hidden="true">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span
                      className={cn(
                        'whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200',
                        isActive
                          ? 'max-w-[14rem] opacity-100'
                          : 'max-w-0 opacity-0 group-hover:max-w-[14rem] group-hover:opacity-100'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* Divider + Depth selector */}
              <div className="hidden lg:block border-l border-navy-700 h-6 mx-2" />
              <ContentDepthSelector />

            </div>
          </div>
        </div>
      </div>
      <div className="subheader-bar-spacer" aria-hidden="true" />
    </>
  );
}
