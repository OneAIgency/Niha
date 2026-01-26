/**
 * Debug Logger - Stores logs in memory for easy viewing
 */

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  log(component: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      component,
      message,
      data
    };

    this.logs.push(entry);

    // Keep only last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console
    console.log(`[${component}] ${message}`, data || '');
  }

  error(component: string, message: string, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      component,
      message,
      data: error
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.error(`[${component}] ${message}`, error || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }

  // Make logs accessible from window for debugging
  exportToWindow() {
    (window as any).debugLogs = this.logs;
    (window as any).getDebugLogs = () => this.getLogs();
    (window as any).clearDebugLogs = () => this.clear();
  }
}

export const debugLogger = new DebugLogger();

// Make it available globally
if (typeof window !== 'undefined') {
  debugLogger.exportToWindow();
}
