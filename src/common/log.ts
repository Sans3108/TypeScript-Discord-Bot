// The purpose of this file is to customize the custom Logger defined in src/classes/Logger
// and to export functions that can be easily used to log different things or handle errors.

import { Logger } from '@classes/Logger.js';
import { colors, spacerChar, tagEndEdge, tagStartEdge } from '@common/constants.js';

const logger = new Logger({
  tabs: {
    color: colors.logger.div,
    symbol: spacerChar
  },
  tagEdges: {
    color: colors.logger.div,
    symbols: {
      start: tagStartEdge,
      end: tagEndEdge
    }
  },
  time: {
    enabled: false
  }
});

export const log = logger.print.bind(logger);
export const wrapLog = logger.wrapPrint.bind(logger);

export const c = Logger.c;

export function handleErr(err: Error) {
  log('error', `${err.name}: ${err.message.split('\n')[0]}`);
  if (err.stack) {
    log('error', 'Stack trace:');
    console.log();
    console.log(err.stack);
    console.log();
  }
}
