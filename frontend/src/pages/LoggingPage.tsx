import { useState } from 'react';
import { FileText, Activity, Bot, AlertTriangle, Search } from 'lucide-react';
import { BackofficeLayout } from '../components/layout';
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

export default function LoggingPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  return (
    <BackofficeLayout>
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-navy-200 dark:border-navy-700 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-navy-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-750'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'failed' && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      !
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
