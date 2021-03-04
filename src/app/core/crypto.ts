const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomString(length: number): string {
  let arr = new Uint8Array(length);
  window.crypto.getRandomValues(arr);
  arr = arr.map(x => validChars.charCodeAt(x % validChars.length));
  return String.fromCharCode.apply(null, arr);
}
