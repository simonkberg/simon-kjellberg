// A Map iterates in insertion order, so re-inserting a key marks it most recently used.
export class LruMap<K, V extends NonNullable<unknown>> {
  #map = new Map<K, V>();
  #maxSize: number;

  constructor(maxSize: number) {
    this.#maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.#map.get(key);
    if (value === undefined) return undefined;
    this.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    this.#map.delete(key);
    this.#map.set(key, value);
    if (this.#map.size > this.#maxSize) {
      this.#map.delete(this.#map.keys().next().value as K);
    }
  }

  delete(key: K): boolean {
    return this.#map.delete(key);
  }

  clear(): void {
    this.#map.clear();
  }
}
