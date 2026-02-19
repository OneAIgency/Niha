/**
 * Frontend API client for the introducer chat endpoint.
 * Handles SSE streaming and tool call parsing.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamEvent {
  type: 'text' | 'tool_start' | 'tool_input' | 'block_stop' | 'done' | 'error';
  text?: string;
  tool?: string;
  id?: string;
  partial_json?: string;
  error?: string;
}

export type OnStreamEvent = (event: StreamEvent) => void;

const TOKEN_KEY = 'auth_token';

function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Send messages to the introducer chat endpoint and stream the response.
 */
export async function streamIntroducerChat(
  messages: ChatMessage[],
  onEvent: OnStreamEvent,
  signal?: AbortSignal,
): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch('/api/v1/introducer/chat', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));
          onEvent(event);
          if (event.type === 'done' || event.type === 'error') return;
        } catch {
          // Skip malformed events
        }
      }
    }
  }
}
