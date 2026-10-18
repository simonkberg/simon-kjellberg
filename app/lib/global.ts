// Next bundles instrumentation.ts and each route handler into separate module
// graphs, so a module-level `let` is one instance per graph, not per process.
export function getGlobal<T>(key: string, init: () => T): T {
  const symbol = Symbol.for(key);
  if (!Reflect.has(globalThis, symbol)) {
    Reflect.set(globalThis, symbol, init());
  }
  return Reflect.get(globalThis, symbol) as T;
}

/** @internal Every test starts without the state `getGlobal` keeps. */
export function resetGlobals(): void {
  for (const symbol of Object.getOwnPropertySymbols(globalThis)) {
    if (Symbol.keyFor(symbol)?.startsWith("simon.dev/")) {
      Reflect.deleteProperty(globalThis, symbol);
    }
  }
}
