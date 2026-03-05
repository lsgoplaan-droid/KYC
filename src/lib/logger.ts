type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  data?: string;
}

const MAX_ENTRIES = 300;
const entries: LogEntry[] = [];

function log(level: LogLevel, tag: string, message: string, data?: unknown) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    tag,
    message,
    data: data !== undefined ? JSON.stringify(data) : undefined,
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }

  if (__DEV__) {
    const prefix = `[${level.toUpperCase()}][${tag}]`;
    const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    if (data !== undefined) {
      console[method](prefix, message, data);
    } else {
      console[method](prefix, message);
    }
  }
}

export const logger = {
  debug: (tag: string, message: string, data?: unknown) => log('debug', tag, message, data),
  info: (tag: string, message: string, data?: unknown) => log('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) => log('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown) => log('error', tag, message, data),
  getEntries: () => [...entries],
  clear: () => { entries.length = 0; },
};
