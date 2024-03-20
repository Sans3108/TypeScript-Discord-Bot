export function idFromToken(token: string) {
  return Buffer.from(token.split('.')[0], 'base64').toString('utf8');
}
