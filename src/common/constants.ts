export const tagStartEdge = '❮' as const;
export const tagEndEdge = '❯' as const;
export const spacerChar = '───' as const;
export const developerIds = ['366536353418182657'];
export const botInvite = 'https://google.com';
export const supportServer = 'https://google.com';

/**
 * This object holds any and all hex colors used in this project.
 */
export const colors = {
  developerMode: {
    on: '#00ff00',
    off: '#ff0000'
  },
  command: {
    name: '#38c3f5',
    symbol: '#4538f5',
    id: '#3ff2b6'
  },
  event: {
    name: '#38c3f5'
  },
  user: {
    name: '#f5cf38',
    id: '#3ff2b6'
  },
  embedColors: {
    error: '#D9632D',
    ok: '#6751B1',
    info: '#2346FF',
    wait: '#9E5B70'
  },
  logger: {
    default: '#ffffff',
    tags: {
      error: '#f54b38',
      setup: '#38f581',
      client: '#9738f5',
      events: '#384ef5',
      commands: '#fc039d',
      process: '#fcc203'
    },
    div: '#4a4a4a'
  },
  number: '#3ff2b6',
  string: '#cefc03'
} as const;
