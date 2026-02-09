import { useState } from 'react';
import { FileText, Activity, Bot, AlertTriangle, Search } from 'lucide-react';
import { BackofficeLayout } from '../components/layout';
import { cn } from '../utils';
import { LoggingOverview } from '../components/backoffice/LoggingOverview';
import { AllTicketsTab } from '../components/backoffice/AllTicketsTab';
import { MarketMakerActionsTab } from '../components/backoffice/MarketMakerActionsTab';
import { FailedActionsTab } from '../components/backoffice/FailedActionsTab';
import { SearchTicketsTab } from '../components/backoffice/SearchTicketsTab';

type TabValue = 'overview' | 'all' | 'mm-actions' | 'failed' | 'search';

interface Tab {
  id: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'all', label: 'All Tickets', icon: FileText },
  { id: 'mm-actions', label: 'MM Actions', icon: Bot },
  { id: 'failed', label: 'Failed Actions', icon: AlertTriangle },
  { id: 'search', label: 'Search', icon: Search },
];

function LoggingTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Logging tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            title={tab.label}
            className={cn(
              'group subsubheader-nav-btn flex items-center gap-2 whitespace-nowrap',
              isActive ? 'subsubheader-nav-btn-active' : 'subsubheader-nav-btn-inactive'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.id === 'failed' && (
              <span className="subsubheader-nav-badge" aria-label="Failed actions">
                !
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default function LoggingPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const subSubHeaderLeft = (
    <LoggingTabNav activeTab={activeTab} onTabChange={setActiveTab} />
  );

  return (
    <BackofficeLayout subSubHeaderLeft={subSubHeaderLeft}>
      {/* Tab Content */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-navy-200 dark:border-navy-700 p-6">
        {activeTab === 'overview' && <LoggingOverview />}
        {activeTab === 'all' && <AllTicketsTab />}
        {activeTab === 'mm-actions' && <MarketMakerActionsTab />}
        {activeTab === 'failed' && <FailedActionsTab />}
        {activeTab === 'search' && <SearchTicketsTab />}
      </div>
    </BackofficeLayout>
  );
}
