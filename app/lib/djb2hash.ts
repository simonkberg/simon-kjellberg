const charToCharCode = (s: string): number => s.charCodeAt(0);
const hashReducer = (a: number, c: number): number => ((a << 5) + a) ^ c;

export function djb2hash(string: string): number {
  if (!string.length) return 0;

  return string.split("").map(charToCharCode).reduce(hashReducer, 5381);
}
