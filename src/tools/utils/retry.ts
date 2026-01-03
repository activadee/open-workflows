export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  signal?: AbortSignal;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, signal } = opts;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === maxRetries - 1;
      const msg = error instanceof Error ? error.message : String(error);

      const isRetryable =
        msg.includes('rate limit') ||
        msg.includes('timeout') ||
        msg.includes('503') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT');

      if (isLast || !isRetryable) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Operation aborted');
  }
}
