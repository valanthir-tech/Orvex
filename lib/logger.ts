export type LogContext = Record<string, unknown>;

function normalizeContext(context?: LogContext): LogContext | undefined {
  if (!context || Object.keys(context).length === 0) {
    return undefined;
  }

  return context;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    const normalized = normalizeContext(context);
    if (normalized) {
      console.info(message, normalized);
      return;
    }
    console.info(message);
  },
  warn(message: string, context?: LogContext): void {
    const normalized = normalizeContext(context);
    if (normalized) {
      console.warn(message, normalized);
      return;
    }
    console.warn(message);
  },
  error(message: string, context?: LogContext): void {
    const normalized = normalizeContext(context);
    if (normalized) {
      console.error(message, normalized);
      return;
    }
    console.error(message);
  },
};

