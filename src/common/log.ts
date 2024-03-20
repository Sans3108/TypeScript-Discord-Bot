import { Log, LogLayerTab, LogTag, ValidLogTagNames } from '@classes/Logger.js';
import { tagColor, tagEndEdge, tagStartEdge } from '@common/constants.js';

const logger = new Log(
  [
    new LogTag(
      {
        name: 'error',
        hexColor: '#f54b38'
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
        hexColor: '#38f581'
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
        hexColor: '#9738f5'
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
        hexColor: '#384ef5'
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
  new LogLayerTab('─', 3, tagColor),
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
