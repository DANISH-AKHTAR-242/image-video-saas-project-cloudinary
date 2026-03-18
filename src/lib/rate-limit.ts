type RateState = {
  count: number;
  resetAt: number;
};

const storage = new Map<string, RateState>();

export function assertRateLimit(
  key: string,
  options: {
    maxRequests: number;
    windowMs: number;
  }
) {
  const now = Date.now();
  const current = storage.get(key);

  if (!current || current.resetAt < now) {
    storage.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return;
  }

  if (current.count >= options.maxRequests) {
    const waitSeconds = Math.ceil((current.resetAt - now) / 1000);
    throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
  }

  current.count += 1;
  storage.set(key, current);
}

