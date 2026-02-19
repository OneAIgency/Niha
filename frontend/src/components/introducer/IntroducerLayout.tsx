import { lazy, Suspense, type ReactNode } from 'react';
import { SectionRegistryProvider } from './SectionRegistry';
import { IntroducerSubheader } from './IntroducerSubheader';
import { ChatFAB } from './ChatFAB';

const ChatPanel = lazy(() => import('./ChatPanel').then(m => ({ default: m.ChatPanel })));

interface IntroducerLayoutProps {
  children: ReactNode;
}

/**
 * Page wrapper for the Introducer Portal.
 * Provides SectionRegistry context and renders the section navigation subheader.
 * ChatPanel is lazy-loaded since most users won't open it immediately.
 */
export function IntroducerLayout({ children }: IntroducerLayoutProps) {
  return (
    <SectionRegistryProvider>
      <IntroducerSubheader />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-12">
        {children}
      </div>
      <Suspense fallback={null}>
        <ChatPanel />
      </Suspense>
      <ChatFAB />
    </SectionRegistryProvider>
  );
}
