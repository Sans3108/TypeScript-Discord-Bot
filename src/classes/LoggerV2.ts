import { HexColor, isHexColor } from '@utils';

/**
 * Interface representing a {@link Logger} tag, with it's color
 */
export interface Tag {
  name: string;
  color?: HexColor;
}

/**
 * Interface representing symbols used for the {@link Logger} class
 */
export interface Symbols {
  tag?: {
    start?: string;
    end?: string;
  };
  tab?: string;
}

/**
 * {@link Logger} options
 */
export interface LoggerOptions {
  symbols?: Symbols;
  tabColor?: HexColor;
}

export class Logger {
  constructor(tagList: NonEmptyArray<Tag>, options: LoggerOptions = {}) {
    const tags: Required<Tag>[] = tagList.map(tag => ({ name: tag.name, color: tag.color ?? '#ffffff' }));

    if (isHexColor(tags[0].color)) console.log('valid');

    const opts: DeepRequired<LoggerOptions> = {
      symbols: {
        tag: {
          start: options.symbols?.tag?.start ?? '[',
          end: options.symbols?.tag?.end ?? ']'
        },
        tab: options.symbols?.tab ?? '-'
      },
      tabColor: options.tabColor ?? '#ffffff'
    };

    console.log(tags, opts);
  }
}

new Logger(
  [
    {
      name: 'test'
    }
  ],
  {
    symbols: {
      tag: {
        start: '<'
      }
    }
  }
);
