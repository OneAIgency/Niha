import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useIntroducerStore } from '../../stores/useIntroducerStore';

interface SectionRegistryContextType {
  registerSection: (id: string, ref: RefObject<HTMLElement>) => void;
  unregisterSection: (id: string) => void;
  scrollToSection: (id: string) => void;
  highlightSection: (id: string) => void;
  expandAccordion: (sectionId: string, itemId: string) => void;
  setActiveTab: (sectionId: string, tabId: string) => void;
}

const SectionRegistryContext = createContext<SectionRegistryContextType | null>(null);

export function SectionRegistryProvider({ children }: { children: ReactNode }) {
  const sectionsRef = useRef<Map<string, RefObject<HTMLElement>>>(new Map());
  const { setActiveSection, expandAccordion, setActiveTab } = useIntroducerStore();

  const registerSection = useCallback((id: string, ref: RefObject<HTMLElement>) => {
    sectionsRef.current.set(id, ref);
  }, []);

  const unregisterSection = useCallback((id: string) => {
    sectionsRef.current.delete(id);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const ref = sectionsRef.current.get(id);
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  }, [setActiveSection]);

  const highlightSection = useCallback((id: string) => {
    const ref = sectionsRef.current.get(id);
    if (ref?.current) {
      ref.current.classList.add('ring-2', 'ring-emerald-500/50', 'transition-shadow');
      setTimeout(() => {
        ref.current?.classList.remove('ring-2', 'ring-emerald-500/50', 'transition-shadow');
      }, 1500);
    }
  }, []);

  // IntersectionObserver to track active section while scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) setActiveSection(id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    // Observe all registered sections
    const interval = setInterval(() => {
      for (const [id, ref] of sectionsRef.current) {
        if (ref.current) {
          ref.current.setAttribute('data-section-id', id);
          observer.observe(ref.current);
        }
      }
      // Stop polling once we have observers set up
      if (sectionsRef.current.size > 0) clearInterval(interval);
    }, 200);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [setActiveSection]);

  const value = useMemo(
    () => ({
      registerSection,
      unregisterSection,
      scrollToSection,
      highlightSection,
      expandAccordion,
      setActiveTab,
    }),
    [registerSection, unregisterSection, scrollToSection, highlightSection, expandAccordion, setActiveTab]
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
 * Hook for section components to register themselves with the registry.
 * Returns a ref to attach to the section's root element.
 */
export function useSection(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerSection, unregisterSection } = useSectionRegistry();

  useEffect(() => {
    registerSection(id, ref as RefObject<HTMLElement>);
    return () => unregisterSection(id);
  }, [id, registerSection, unregisterSection]);

  return ref;
}
