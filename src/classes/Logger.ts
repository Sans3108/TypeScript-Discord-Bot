import chalk from 'chalk';

export interface LogTagEdges {
  readonly chars: {
    readonly start: string;
    readonly end: string;
  };
  readonly hexColor: string;
}

export const ValidLogTagNames = {
  client: 'Client',
  events: 'Events',
  setup: 'Setup',
  error: 'Error',
  commands: 'Commands'
};

function generatePaddedValues(strings: { [K in keyof typeof ValidLogTagNames]: string }): {
  [K in keyof typeof ValidLogTagNames]: number;
} {
  const maxLength = Math.max(...Object.values(strings).map(str => str.length));

  // @ts-expect-error
  const paddedValues: { [K in keyof typeof ValidLogTagNames]: number } = {};

  for (const key in strings) {
    const str = strings[key as keyof typeof ValidLogTagNames];

    paddedValues[key as keyof typeof ValidLogTagNames] = maxLength - str.length;
  }

  return paddedValues;
}

// Generate padded values for ValidLogTagNames
export const ValidLogTagNamePadding = generatePaddedValues(ValidLogTagNames);

export interface LogTagName {
  readonly name: keyof typeof ValidLogTagNames;
  readonly spaceChar: string;
  readonly hexColor: string;
}

/**
 * Class representing a tag used in {@link Log}.
 */
export class LogTag {
  /**
   * Create a new LogTag object, stringify to use.
   * @param tagName The tag name, it's color and a space char.
   * @param tagEdges The tag edge characters + their color.
   */
  constructor(
    public readonly tagName: LogTagName,
    public readonly tagEdges: LogTagEdges
  ) {}

  toString(padding = 0) {
    const nameCol = chalk.hex(this.tagName.hexColor);
    const edgeCol = chalk.hex(this.tagEdges.hexColor);

    const padLeftAmount = Math.floor(padding / 2);
    const padRightAmount = Math.floor(padding / 2) + (padding % 2);

    const paddingLeft = padLeftAmount === 0 ? '' : this.tagName.spaceChar.repeat(padLeftAmount - 1) + ' ';
    const paddingRight = padRightAmount === 0 ? '' : ' ' + this.tagName.spaceChar.repeat(padRightAmount - 1);

    const name = nameCol(`${edgeCol(paddingLeft)}${ValidLogTagNames[this.tagName.name]}${edgeCol(paddingRight)}`);
    const start = edgeCol(this.tagEdges.chars.start);
    const end = edgeCol(this.tagEdges.chars.end);

    return `${start}${name}${end}`;
  }
}

/**
 * Class representing a layer tab used in {@link Log}.
 */
export class LogLayerTab {
  /**
   * Create a new LogLayerTab object, stringify to use.
   * @param char The character to be used.
   * @param color The hex color of the tab.
   * @param size The size of the tab.
   */
  constructor(
    public readonly char: string,
    public readonly size: number,
    public readonly color: string
  ) {}

  toString() {
    return chalk.hex(this.color)(this.char.repeat(this.size));
  }
}

/**
 * Class representing a logging object.
 */
export class Log {
  public readonly tags: ReadonlyArray<{ id: keyof typeof ValidLogTagNames; tag: string }>;
  public readonly layerTab: LogLayerTab;
  public readonly spaceAfterTag: boolean;
  public readonly spaceBetweenLayers: boolean;
  public readonly spaceBeforeMessage: boolean;

  /**
   * Create a new Log object.
   * @param tags The tags that should be used.
   * @param spaceAfterTag Wether to add a space after each tag in the log.
   * @param layerTabLength The length of each layer tab.
   * @param layerTabChar The character used to build tabs
   */
  constructor(tags: ReadonlyArray<LogTag>, layerTab: LogLayerTab, spaceAfterTag = true, spaceBetweenLayers = true, spaceBeforeMessage = true) {
    this.tags = tags.map(t => ({
      id: t.tagName.name,
      tag: t.toString(ValidLogTagNamePadding[t.tagName.name])
    }));
    this.spaceAfterTag = spaceAfterTag;
    this.layerTab = layerTab;
    this.spaceBeforeMessage = spaceBeforeMessage;
    this.spaceBetweenLayers = spaceBetweenLayers;
  }

  /**
   * Print a message to the console.
   * @param tag The tag that should be used.
   * @param message The message to be logged.
   * @param layer The layer this should be on.
   * @param level The level of this log.
   */
  public print(tag: keyof typeof ValidLogTagNames, message: string, layer = 0): void {
    const coloredTag = this.tags.find(t => t.id === tag);

    if (!coloredTag) {
      console.warn(`Logger: Tag \`${tag}\` was not found!`);
    }

    console.log(`${coloredTag?.tag}${this.spaceAfterTag ? ' ' : ''}${(layer > 0 ? ' ' : '') + `${this.layerTab}${this.spaceBetweenLayers ? ' ' : ''}`.repeat(layer).trim()}${this.spaceBeforeMessage ? ' ' : ''}${message}`);
  }

  /**
   * Colors the text with the given hex color to be logged to the console.
   * @param text
   * @param color
   */
  public static c(text: string, hexCol: string): string {
    return chalk.hex(hexCol)(text);
  }
}
