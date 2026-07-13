import type { Cache } from "./cache.js";

interface CacheEntry<TValue> {
  readonly value: TValue;
  readonly expiresAt: number;
}

interface MemoryCacheOptions {
  readonly maximumEntries?: number;
  readonly now?: () => number;
}

const DEFAULT_MAXIMUM_ENTRIES = 100;

export class MemoryCache<TValue> implements Cache<TValue> {
  readonly #entries = new Map<string, CacheEntry<TValue>>();
  readonly #maximumEntries: number;
  readonly #now: () => number;

  constructor({
    maximumEntries = DEFAULT_MAXIMUM_ENTRIES,
    now = Date.now,
  }: MemoryCacheOptions = {}) {
    if (!Number.isInteger(maximumEntries) || maximumEntries < 1) {
      throw new Error("maximumEntries must be a positive integer.");
    }

    this.#maximumEntries = maximumEntries;
    this.#now = now;
  }

  get size(): number {
    this.#pruneExpired();
    return this.#entries.size;
  }

  get(key: string): TValue | undefined {
    const entry = this.#entries.get(key);

    if (entry === undefined) {
      return undefined;
    }

    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return undefined;
    }

    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: TValue, ttlSeconds: number): void {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error("ttlSeconds must be greater than zero.");
    }

    this.#pruneExpired();
    this.#entries.delete(key);

    while (this.#entries.size >= this.#maximumEntries) {
      const oldestKey = this.#entries.keys().next().value as string | undefined;
      if (oldestKey === undefined) break;
      this.#entries.delete(oldestKey);
    }

    this.#entries.set(key, {
      value,
      expiresAt: this.#now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): boolean {
    return this.#entries.delete(key);
  }

  clear(): void {
    this.#entries.clear();
  }

  #pruneExpired(): void {
    const now = this.#now();

    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt <= now) {
        this.#entries.delete(key);
      }
    }
  }
}
