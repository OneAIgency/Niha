import { create } from 'zustand';

export interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface IntroducerState {
  // Dashboard tab navigation
  dashboardTab: string;
  setDashboardTab: (tab: string) => void;

  // Accordion state (which items are expanded, per section)
  expandedAccordions: Record<string, string[]>;
  toggleAccordion: (sectionId: string, itemId: string) => void;
  expandAccordion: (sectionId: string, itemId: string) => void;

  // Active tabs per section
  activeTabs: Record<string, string>;
  setActiveTab: (sectionId: string, tabId: string) => void;

  // Chat panel
  isChatOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;

  // Chat messages
  chatMessages: ChatMsg[];
  isChatLoading: boolean;
  addChatMessage: (msg: ChatMsg) => void;
  updateLastAssistant: (text: string) => void;
  setChatLoading: (loading: boolean) => void;

  // Calculator inputs (for ROI calculator)
  calcInputs: {
    euaVolume: number;
    currentEuaPrice: number;
    nihaDiscount: number;
  };
  setCalcInput: (key: keyof IntroducerState['calcInputs'], value: number) => void;
}

export const useIntroducerStore = create<IntroducerState>((set) => ({
  dashboardTab: 'overview',
  setDashboardTab: (tab) => set({ dashboardTab: tab }),

  expandedAccordions: {},
  toggleAccordion: (sectionId, itemId) =>
    set((state) => {
      const current = state.expandedAccordions[sectionId] ?? [];
      const isExpanded = current.includes(itemId);
      return {
        expandedAccordions: {
          ...state.expandedAccordions,
          [sectionId]: isExpanded
            ? current.filter((id) => id !== itemId)
            : [...current, itemId],
        },
      };
    }),
  expandAccordion: (sectionId, itemId) =>
    set((state) => {
      const current = state.expandedAccordions[sectionId] ?? [];
      if (current.includes(itemId)) return state;
      return {
        expandedAccordions: {
          ...state.expandedAccordions,
          [sectionId]: [...current, itemId],
        },
      };
    }),

  activeTabs: {},
  setActiveTab: (sectionId, tabId) =>
    set((state) => ({
      activeTabs: { ...state.activeTabs, [sectionId]: tabId },
    })),

  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  chatMessages: [],
  isChatLoading: false,
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  updateLastAssistant: (text) =>
    set((state) => {
      const msgs = [...state.chatMessages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], content: msgs[lastIdx].content + text };
      }
      return { chatMessages: msgs };
    }),
  setChatLoading: (loading) => set({ isChatLoading: loading }),

  calcInputs: {
    euaVolume: 100000,
    currentEuaPrice: 81,
    nihaDiscount: 10,
  },
  setCalcInput: (key, value) =>
    set((state) => ({
      calcInputs: { ...state.calcInputs, [key]: value },
    })),
}));
