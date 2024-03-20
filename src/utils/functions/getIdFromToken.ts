export function getIdFromToken(token: string): string {
  return atob(token.split('.')[0]);
}
