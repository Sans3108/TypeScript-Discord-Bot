import { ChatInputCommand, Cooldown, MessageContextCommand, UserContextCommand } from '@classes/client/Command.js';
import { loggedCommand } from '@utils';
import { Client, ClientOptions, ClientUser, Collection, IntentsBitField, InviteGenerationOptions } from 'discord.js';

export interface CustomClientOptions extends ClientOptions {
  commandErrorCooldownSeconds: number;
  logCommandUses?: boolean;
  inviteGenerationOptions?: InviteGenerationOptions;
  allowUserInstalledCommands: boolean;
  allowGuildInstalledCommands: boolean;
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

    if (!clientOpts.allowGuildInstalledCommands && !clientOpts.allowUserInstalledCommands) {
      throw new Error(`At least one type of command must be allowed.`);
    }

    this.commands = new Collection<string, ChatInputCommand | MessageContextCommand | UserContextCommand>();
    this.commandCooldownMaps = new Collection<string, Collection<string, Cooldown>>();
  }

  addCommand(command: ChatInputCommand | MessageContextCommand | UserContextCommand) {
    if (!command.patched) throw new Error(`${loggedCommand(command)} is not patched.`);

    if (command.guildInstalled && !this.options.allowGuildInstalledCommands) throw new Error(`${loggedCommand(command)} is guild installed but client doesn't allow it.`);

    if (command.userInstalled && !this.options.allowUserInstalledCommands) throw new Error(`${loggedCommand(command)} is user installed but client doesn't allow it.`);

    this.commands.set(command.name, command);
    this.commandCooldownMaps.set(command.name, new Collection<string, Cooldown>());
  }
}
