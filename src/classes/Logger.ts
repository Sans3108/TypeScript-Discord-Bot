import { colors } from '@common/constants.js';
import { HexColor, capitalize, currentDateTime, isHexColor } from '@utils';
import chalk from 'chalk';

// `name` should be lowercase
export interface Tag {
  name: string;
  color: HexColor;
}

export interface TagWithPadding extends Tag {
  padding: number;
}

// Edit as necessary
// Type of each object should be Tag
// It's not typed as an array of such because the TagName type depends on this for intellisense
const tags = [
  { name: 'client', color: colors.logger.tags.client },
  { name: 'events', color: colors.logger.tags.events },
  { name: 'setup', color: colors.logger.tags.setup },
  { name: 'error', color: colors.logger.tags.error },
  { name: 'commands', color: colors.logger.tags.commands },
  { name: 'process', color: colors.logger.tags.process },
  { name: 'warn', color: colors.logger.tags.warn },
  { name: 'debug', color: colors.logger.tags.debug }
] as const;

export type TagName = (typeof tags)[number]['name'];

export interface LoggerOptions {
  tagEdges?: {
    color?: HexColor;
    symbols?: {
      start?: string;
      end?: string;
    };
  };
  tabs?: {
    color?: HexColor;
    symbol?: string;
  };
  wrapLen?: number;
  time?: {
    enabled?: boolean;
    color?: HexColor;
  };
}

export class Logger {
  private readonly tags: TagWithPadding[];
  private readonly opts: DeepRequired<LoggerOptions>;

  constructor(options: LoggerOptions = {}) {
    this.opts = {
      tagEdges: {
        color: options.tagEdges?.color ?? colors.logger.default,
        symbols: {
          start: options.tagEdges?.symbols?.start ?? '[',
          end: options.tagEdges?.symbols?.end ?? ']'
        }
      },
      tabs: {
        color: options.tabs?.color ?? colors.logger.default,
        symbol: options.tabs?.symbol ?? '-'
      },
      wrapLen: options.wrapLen ?? 80,
      time: {
        enabled: options.time?.enabled ?? true,
        color: options.time?.color ?? colors.logger.time
      }
    };

    if (!isHexColor(this.opts.tagEdges.color)) this.opts.tagEdges.color = colors.logger.default;
    if (!isHexColor(this.opts.tabs.color)) this.opts.tabs.color = colors.logger.default;

    this.tags = [];

    const clonedTags: Tag[] = JSON.parse(JSON.stringify(tags));

    const longestTag = Object.values(clonedTags).sort((a, b) => b.name.length - a.name.length)[0];

    for (const tag of clonedTags) {
      if (!isHexColor(tag.color)) {
        tag.color = colors.logger.default;
      }

      (tag as TagWithPadding).padding = longestTag.name.length - tag.name.length;

      this.tags.push(tag as TagWithPadding);
    }
  }

  /**
   * Print a message to the console.
   * @param tagName The tag that should be used.
   * @param message The message to be logged.
   * @param tabLayer The layer this should be on.
   */
  public print(tagName: TagName, message: string, tabLayer = 0): void {
    const time = Logger.c(currentDateTime(), this.opts.time.color);

    const tag = this.tags.find(tag => tag.name === tagName);

    if (!tag) throw new Error(`Tag ${tagName} not found.`);

    const tagNameColor = chalk.hex(tag.color);
    const tagEdgeColor = chalk.hex(this.opts.tagEdges.color);
    const tabColor = chalk.hex(this.opts.tabs.color);

    const coloredTagEdges = [tagEdgeColor(this.opts.tagEdges.symbols.start), tagEdgeColor(this.opts.tagEdges.symbols.end)];
    const coloredTagName = tagNameColor(capitalize(tag.name));
    const coloredTab = tabColor(this.opts.tabs.symbol);

    const paddedTagName = `${' '.repeat(tag.padding)}${coloredTagName}`;
    const formattedTag = `${coloredTagEdges[0]} ${paddedTagName} ${coloredTagEdges[1]}`;

    const formattedTabLayer = `${tabLayer === 0 ? ' ' : ''}${coloredTab.repeat(tabLayer)}${tabLayer === 0 ? '' : ' '}`;

    const output = `${formattedTag}${formattedTabLayer}${message}`;

    console.log(this.opts.time.enabled ? `${time} ${output}` : output);
  }

  /**
   * Print a message to the console respecting wrapLen.
   * @param tagName The tag that should be used.
   * @param message The message to be logged.
   * @param tabLayer The layer this should be on.
   */
  public wrapPrint(tagName: TagName, message: string, tabLayer = 0): void {
    const time = Logger.c(currentDateTime(), this.opts.time.color);

    const tag = this.tags.find(tag => tag.name === tagName);

    if (!tag) throw new Error(`Tag ${tagName} not found.`);

    const tagNameColor = chalk.hex(tag.color);
    const tagEdgeColor = chalk.hex(this.opts.tagEdges.color);
    const tabColor = chalk.hex(this.opts.tabs.color);

    const coloredTagEdges = [tagEdgeColor(this.opts.tagEdges.symbols.start), tagEdgeColor(this.opts.tagEdges.symbols.end)];
    const coloredTagName = tagNameColor(capitalize(tag.name));
    const coloredTab = tabColor(this.opts.tabs.symbol);

    const paddedTagName = `${' '.repeat(tag.padding)}${coloredTagName}`;
    const formattedTag = `${coloredTagEdges[0]} ${paddedTagName} ${coloredTagEdges[1]}`;

    const formattedTabLayer = `${tabLayer === 0 ? ' ' : ''}${coloredTab.repeat(tabLayer)}${tabLayer === 0 ? '' : ' '}`;

    // Word wrapping logic
    const words = message.split(' ');
    let currentLine = '';

    for (const word of words) {
      // Check if adding the next word would exceed the wrap length
      if ((currentLine + word).length > this.opts.wrapLen) {
        // Print the current line with the formatted tag and tab layer
        console.log(`${this.opts.time.enabled ? time : ''}${formattedTag}${formattedTabLayer}${currentLine.trim()}`);
        currentLine = ''; // Start a new line
      }
      currentLine += word + ' '; // Add the word to the current line
    }

    // Print any remaining text in the current line
    if (currentLine.trim().length > 0) {
      console.log(`${this.opts.time.enabled ? time : ''}${formattedTag}${formattedTabLayer}${currentLine.trim()}`);
    }
  }

  /**
   * Colors text with the given hex color.
   * @param text
   * @param color
   */
  public static c(text: string, hexCol: HexColor): string {
    return chalk.hex(isHexColor(hexCol) ? hexCol : colors.logger.default)(text);
  }
}
