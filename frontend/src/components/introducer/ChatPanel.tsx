import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { useSectionRegistry } from './SectionRegistry';
import { streamIntroducerChat, type StreamEvent } from '../../services/introducerChatApi';
import { NAV_ITEMS } from './constants';

const WELCOME_MESSAGE = "Welcome! I'm your NIHA carbon markets specialist. I can help you understand our cross-border trading mechanism, answer questions about EU ETS and China ETS, prepare for client conversations, and navigate this portal. What would you like to know?";

function getSectionLabel(sectionId: string): string {
  return NAV_ITEMS.find((n) => n.id === sectionId)?.label ?? sectionId;
}

export function ChatPanel() {
  const {
    isChatOpen, closeChat,
    chatMessages, isChatLoading,
    addChatMessage, updateLastAssistant, setChatLoading,
    expandAccordion, setActiveTab,
  } = useIntroducerStore();
  const registry = useSectionRegistry();
  const prefersReduced = useReducedMotion();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasInit = useRef(false);

  // Add welcome message on first open
  useEffect(() => {
    if (isChatOpen && !hasInit.current && chatMessages.length === 0) {
      hasInit.current = true;
      addChatMessage({ role: 'assistant', content: WELCOME_MESSAGE });
    }
  }, [isChatOpen, chatMessages.length, addChatMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Close on Escape
  useEffect(() => {
    if (!isChatOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeChat();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isChatOpen, closeChat]);

  // Focus textarea on open
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const executeTool = useCallback((toolName: string, toolInput: Record<string, string>) => {
    switch (toolName) {
      case 'switchToTab':
        if (toolInput.sectionId) {
          const { setDashboardTab } = useIntroducerStore.getState();
          setDashboardTab(toolInput.sectionId);
          addChatMessage({ role: 'system', content: `Switched to: ${getSectionLabel(toolInput.sectionId)}` });
        }
        break;
      case 'expandAccordion':
        if (toolInput.sectionId && toolInput.itemId) {
          expandAccordion(toolInput.sectionId, toolInput.itemId);
          addChatMessage({ role: 'system', content: `Expanded: ${toolInput.itemId}` });
        }
        break;
      case 'setActiveTab':
        if (toolInput.sectionId && toolInput.tabId) {
          setActiveTab(toolInput.sectionId, toolInput.tabId);
          addChatMessage({ role: 'system', content: `Switched tab: ${toolInput.tabId}` });
        }
        break;
      case 'highlightSection':
        if (toolInput.sectionId) {
          registry.highlightSection(toolInput.sectionId);
        }
        break;
    }
  }, [registry, expandAccordion, setActiveTab, addChatMessage]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isChatLoading) return;

    setInput('');
    addChatMessage({ role: 'user', content: text });
    addChatMessage({ role: 'assistant', content: '' });
    setChatLoading(true);

    const apiMessages = [...chatMessages, { role: 'user' as const, content: text }]
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const abort = new AbortController();
    abortRef.current = abort;

    let currentToolName = '';
    let currentToolInput = '';

    try {
      await streamIntroducerChat(
        apiMessages,
        (event: StreamEvent) => {
          switch (event.type) {
            case 'text':
              if (event.text) updateLastAssistant(event.text);
              break;
            case 'tool_start':
              currentToolName = event.tool ?? '';
              currentToolInput = '';
              break;
            case 'tool_input':
              currentToolInput += event.partial_json ?? '';
              break;
            case 'block_stop':
              if (currentToolName) {
                try {
                  const toolArgs = JSON.parse(currentToolInput);
                  executeTool(currentToolName, toolArgs);
                } catch { /* malformed tool input */ }
                currentToolName = '';
                currentToolInput = '';
              }
              break;
            case 'error':
              addChatMessage({ role: 'system', content: `Error: ${event.error ?? 'Something went wrong'}` });
              break;
          }
        },
        abort.signal,
      );
    } catch (err: any) {
      if ((err as Error).name !== 'AbortError') {
        addChatMessage({ role: 'system', content: err.message || 'Failed to connect to AI service.' });
      }
    } finally {
      setChatLoading(false);
      abortRef.current = null;
    }
  }, [input, isChatLoading, chatMessages, addChatMessage, updateLastAssistant, setChatLoading, executeTool]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/30"
            onClick={closeChat}
          />

          {/* Panel */}
          <motion.div
            initial={prefersReduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] sm:max-w-[90vw] bg-navy-900 border-l border-navy-700 flex flex-col z-50"
            role="dialog"
            aria-label="AI Chat Assistant"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-sm font-medium text-white">NIHA Carbon Specialist</span>
              </div>
              <button
                onClick={closeChat}
                className="p-1.5 rounded-lg hover:bg-navy-800 text-navy-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" role="log" aria-live="polite">
              {chatMessages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 max-w-[85%] text-sm text-navy-100">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.content && (
                    <div className="flex justify-start">
                      <div className="bg-navy-800/50 rounded-lg p-3 max-w-[85%] text-sm text-navy-200 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.role === 'system' && (
                    <div className="text-center">
                      <span className="text-xs text-navy-500 italic">
                        {msg.content}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && chatMessages[chatMessages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="bg-navy-800/50 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" aria-hidden="true" />
                    <span className="text-xs text-navy-400">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-navy-700 px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  disabled={isChatLoading}
                  rows={1}
                  aria-label="Type your question"
                  className={cn(
                    'flex-1 resize-none bg-navy-800/50 border border-navy-700 rounded-lg px-3 py-2',
                    'text-sm text-white placeholder:text-navy-600',
                    'focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    'max-h-[96px] overflow-y-auto',
                    isChatLoading && 'opacity-50'
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={isChatLoading || !input.trim()}
                  aria-label="Send message"
                  className={cn(
                    'p-2 rounded-lg transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    input.trim() && !isChatLoading
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-navy-800 text-navy-600 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-navy-600 mt-1.5">Powered by Claude AI</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
