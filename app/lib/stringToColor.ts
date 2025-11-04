import { djb2hash } from "@/lib/djb2hash";

export function stringToColor(
  string: string,
  saturation = 0.95,
  lightness = 0.65,
) {
  return `hsl(${djb2hash(string) % 360} ${saturation * 100}% ${lightness * 100}%)`;
}
