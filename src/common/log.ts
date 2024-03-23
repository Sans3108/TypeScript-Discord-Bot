import { Log, LogLayerTab, LogTag, ValidLogTagNames } from '@classes/Logger.js';
import { spacerChar, tagColor, tagEndEdge, tagStartEdge } from '@common/constants.js';

const logger = new Log(
  [
    new LogTag(
      {
        name: 'error',
        hexColor: '#f54b38',
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: tagColor
      }
    ),
    new LogTag(
      {
        name: 'setup',
        hexColor: '#38f581',
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: tagColor
      }
    ),
    new LogTag(
      {
        name: 'client',
        hexColor: '#9738f5',
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: tagColor
      }
    ),
    new LogTag(
      {
        name: 'events',
        hexColor: '#384ef5',
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: tagColor
      }
    ),
    new LogTag(
      {
        name: 'commands',
        hexColor: '#fc039d',
        spaceChar: spacerChar
      },
      {
        chars: {
          start: tagStartEdge,
          end: tagEndEdge
        },
        hexColor: tagColor
      }
    )
  ],
  new LogLayerTab(spacerChar, 3, tagColor),
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
