/* eslint-disable react-refresh/only-export-components -- exports hooks alongside provider */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useIntroducerStore } from '../../stores/useIntroducerStore';

interface SectionRegistryContextType {
  scrollToSection: (id: string) => void;
  highlightSection: (id: string) => void;
  expandAccordion: (sectionId: string, itemId: string) => void;
  setActiveTab: (sectionId: string, tabId: string) => void;
}

const SectionRegistryContext = createContext<SectionRegistryContextType | null>(null);

export function SectionRegistryProvider({ children }: { children: ReactNode }) {
  const { setDashboardTab, expandAccordion, setActiveTab } = useIntroducerStore();

  // scrollToSection now switches the dashboard tab instead of scrolling
  const scrollToSection = useCallback((id: string) => {
    setDashboardTab(id);
  }, [setDashboardTab]);

  const highlightSection = useCallback((id: string) => {
    // With tab-based navigation, highlight is a no-op for now
    // The tab switch itself draws attention to the content
    setDashboardTab(id);
  }, [setDashboardTab]);

  const value = useMemo(
    () => ({
      scrollToSection,
      highlightSection,
      expandAccordion,
      setActiveTab,
    }),
    [scrollToSection, highlightSection, expandAccordion, setActiveTab]
  );

  return (
    <SectionRegistryContext.Provider value={value}>
      {children}
    </SectionRegistryContext.Provider>
  );
}

export function useSectionRegistry() {
  const ctx = useContext(SectionRegistryContext);
  if (!ctx) throw new Error('useSectionRegistry must be used within SectionRegistryProvider');
  return ctx;
}

/**
 * Hook for section components. Returns a ref for the section root element.
 * With tab-based navigation, this is just a simple ref (no IntersectionObserver).
 */
export function useSection(_id: string) {
  return useRef<HTMLDivElement>(null);
}
