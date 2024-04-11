/**
 * Represents a Hexadecimal Color
 * Use {@link isHexColor} to validate that it respects the correct format.
 */
export type HexColor = `#${string}`;

export const hexChars: ReadonlyArray<string> = Object.freeze(['a', 'b', 'c', 'd', 'e', 'f', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

export function isHexColor(color: string): color is HexColor {
  if (!color.startsWith('#') || color.length !== 7) return false;

  const colorChars = color.slice(1).toLowerCase().split('');

  return colorChars.every(char => hexChars.includes(char));
}
