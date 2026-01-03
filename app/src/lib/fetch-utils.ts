/**
 * Fetch utilities with timeout support
 * Prevents infinite hangs on external API calls
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = 'FetchTimeoutError';
  }
}

/**
 * Fetch with configurable timeout
 * @param url - URL to fetch
 * @param options - Standard fetch options plus optional timeout (default 30s)
 * @returns Response from fetch
 * @throws FetchTimeoutError if request times out
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(url, timeout);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

