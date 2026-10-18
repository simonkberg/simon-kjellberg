// Next bundles instrumentation.ts and each route handler into separate module
// graphs, so a module-level `let` is one instance per graph, not per process.
const PREFIX = "simon.dev/";

export function getGlobal<T>(key: string, init: () => T): T {
  const symbol = Symbol.for(PREFIX + key);
  if (!Reflect.has(globalThis, symbol)) {
    Reflect.set(globalThis, symbol, init());
  }
  return Reflect.get(globalThis, symbol) as T;
}

/** @internal Every test starts without the state `getGlobal` keeps. */
export function resetGlobals(): void {
  for (const symbol of Object.getOwnPropertySymbols(globalThis)) {
    if (Symbol.keyFor(symbol)?.startsWith(PREFIX)) {
      Reflect.deleteProperty(globalThis, symbol);
    }
  }
}
