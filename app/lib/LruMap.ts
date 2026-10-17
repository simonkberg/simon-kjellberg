// A Map iterates in insertion order, so re-inserting a key marks it most recently used.
export class LruMap<K, V> {
  #map = new Map<K, V>();
  #maxSize: number;

  constructor(maxSize: number) {
    this.#maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.#map.has(key)) return undefined;
    const value = this.#map.get(key) as V;
    this.set(key, value);
    return value;
  }

  set(key: K, value: V): this {
    this.#map.delete(key);
    this.#map.set(key, value);
    if (this.#map.size > this.#maxSize) {
      const oldest = this.#map.keys().next();
      if (!oldest.done) this.#map.delete(oldest.value);
    }
    return this;
  }

  delete(key: K): boolean {
    return this.#map.delete(key);
  }

  clear(): void {
    this.#map.clear();
  }
}
