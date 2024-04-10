import { HexColor } from '@utils';

export type NonEmptyArray<T> = [T, ...T[]];

export interface Tag {
  name: string;
  color?: HexColor;
}

export interface Symbols {
  tag?: {
    start?: string;
    end?: string;
  };
  tab?: string;
}

export interface LoggerOptions {
  symbols?: Symbols;
  tabColor?: HexColor;
}

export class Logger {
  constructor(tagList: NonEmptyArray<Tag>, options: LoggerOptions = {}) {
    const tags: NonEmptyArray<Required<Tag>> = tagList.map(tag => ({ name: tag.name, color: tag.color ?? '#ffffff' })) as NonEmptyArray<Required<Tag>>;

    const opts: Omit<Required<LoggerOptions>, 'symbols'> & { symbols: Omit<Required<Symbols>, 'tag'> & { tag: Required<{ start: string; end: string }> } } = {
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
