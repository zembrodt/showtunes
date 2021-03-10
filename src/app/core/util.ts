export const VALID_HEX = '^[A-Za-z0-9]{6}';

const VALID_HEX_REGEX = new RegExp(VALID_HEX);
export function isValidHex(hex: string): boolean {
  return VALID_HEX_REGEX.test(hex);
}
