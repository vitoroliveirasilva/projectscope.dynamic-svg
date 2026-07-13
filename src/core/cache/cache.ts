export interface Cache<TValue> {
  get(key: string): TValue | undefined;
  set(key: string, value: TValue, ttlSeconds: number): void;
  delete(key: string): boolean;
  clear(): void;
  readonly size: number;
}
