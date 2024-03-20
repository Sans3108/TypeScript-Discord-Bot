import { Command, Cooldown } from '@classes/client/Command.js';
import { Client, ClientOptions, ClientUser, Collection, IntentsBitField } from 'discord.js';

export interface CustomClientOptions extends ClientOptions {
  commandErrorCooldown: number;
}

export class CustomClient extends Client {
  commands: Collection<string, Command>;
  cooldowns: Collection<string, Collection<string, Cooldown>>;
  buttonCooldowns: Collection<string, number>;
  skips: Collection<string, string[]>;
  declare user: ClientUser; // -_-
  declare options: Omit<CustomClientOptions, 'intents'> & {
    intents: IntentsBitField;
  };

  constructor(clientOpts: CustomClientOptions) {
    super(clientOpts);
    this.commands = new Collection<string, Command>();
    this.buttonCooldowns = new Collection<string, number>();
    this.cooldowns = new Collection<string, Collection<string, Cooldown>>();
    this.skips = new Collection<string, string[]>();
  }

  addCommand(command: Command) {
    this.commands.set(command.name, command);
    this.cooldowns.set(command.name, new Collection<string, Cooldown>());
  }
}
