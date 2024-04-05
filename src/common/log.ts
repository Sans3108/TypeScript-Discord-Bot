// The purpose of this file is to customize the custom Logger defined in src/classes/Logger
// and to export a function that can be easily used to log different things

import { Log, LogLayerTab, LogTag, ValidLogTagNames } from '@classes/Logger.js';
import { colors, spacerChar, tagEndEdge, tagStartEdge } from '@common/constants.js';

const logger = new Log(
  [
    new LogTag(
      {
        name: 'error',
        hexColor: colors.logger.tags.error,
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: colors.logger.div
      }
    ),
    new LogTag(
      {
        name: 'setup',
        hexColor: colors.logger.tags.setup,
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: colors.logger.div
      }
    ),
    new LogTag(
      {
        name: 'client',
        hexColor: colors.logger.tags.client,
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: colors.logger.div
      }
    ),
    new LogTag(
      {
        name: 'events',
        hexColor: colors.logger.tags.events,
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: colors.logger.div
      }
    ),
    new LogTag(
      {
        name: 'commands',
        hexColor: colors.logger.tags.commands,
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: colors.logger.div
      }
    )
  ],
  new LogLayerTab(spacerChar, 3, colors.logger.div),
  false,
  false,
  true
);

export const log = (tag: keyof typeof ValidLogTagNames, message: string, layer?: number) => {
  logger.print(tag, message, layer);
};

export const c = Log.c;

export function handleErr(err: Error) {
  log('error', `${err.name}: ${err.message}${err.stack ? `\n\n${err.stack}` : ''}`);
}
