import { Briefcase, MessageCircle } from 'lucide-react';
import { cn } from '../../utils';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { useSectionRegistry } from './SectionRegistry';
import { NAV_ITEMS } from './constants';

/**
 * Section navigation subheader for the Introducer Portal.
 * Uses button-based nav (scroll-to-section) instead of Link-based routing.
 */
export function IntroducerSubheader() {
  const { activeSection, openChat } = useIntroducerStore();
  const { scrollToSection } = useSectionRegistry();

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

            {/* Right: Section nav + chat button */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
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

              {/* Chat toggle */}
              <button
                onClick={openChat}
                title="Ask AI Assistant"
                className="subheader-nav-btn subheader-nav-btn-inactive ml-2 !text-emerald-400 hover:!bg-emerald-500/10"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="subheader-bar-spacer" aria-hidden="true" />
    </>
  );
}
