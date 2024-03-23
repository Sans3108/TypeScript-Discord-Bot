import { ChatInputCommand, Cooldown, MessageContextCommand, UserContextCommand } from '@classes/client/Command.js';
import { Client, ClientOptions, ClientUser, Collection, IntentsBitField } from 'discord.js';

export interface CustomClientOptions extends ClientOptions {
  commandErrorCooldown: number;
  logCommandUses?: boolean;
}

export class CustomClient extends Client {
  commands: Collection<string, ChatInputCommand | MessageContextCommand | UserContextCommand>;
  commandCooldownMaps: Collection<string, Collection<string, Cooldown>>;
  declare user: ClientUser; // -_-
  declare options: Omit<CustomClientOptions, 'intents'> & {
    intents: IntentsBitField;
  };

  constructor(clientOpts: CustomClientOptions) {
    super(clientOpts);
    this.commands = new Collection<string, ChatInputCommand | MessageContextCommand | UserContextCommand>();
    this.commandCooldownMaps = new Collection<string, Collection<string, Cooldown>>();
  }

  addCommand(command: ChatInputCommand | MessageContextCommand | UserContextCommand) {
    this.commands.set(command.name, command);
    this.commandCooldownMaps.set(command.name, new Collection<string, Cooldown>());
  }
}
