import { CustomClient } from '@classes/client/CustomClient.js';
import { supportServer } from '@common/constants.js';
import { emb, formatTime } from '@utils';
import { ChatInputCommandInteraction, ContextMenuCommandBuilder, ContextMenuCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const CommandType = {
  slash: 'SLASH',
  context: 'CONTEXT'
} as const;

export const CommandGroup = {
  general: 'GENERAL',
  music: 'MUSIC',
  context: 'CONTEXT',
  dev: 'DEV'
} as const;

export const CooldownStatus = {
  apply: 'APPLY',
  dontApply: 'DONT_APPLY',
  errored: 'ERRORED'
} as const;

export interface Cooldown {
  time: number;
  type: (typeof CooldownStatus)[keyof typeof CooldownStatus];
}

export interface CommandConfig {
  cooldown: number;
  group: (typeof CommandGroup)[keyof typeof CommandGroup];
  helpText?: string;
  name: string;
  description: string;
  guildOnly: boolean;
}

export type CommandExecute<T extends (typeof CommandType)[keyof typeof CommandType]> = (
  interaction: T extends (typeof CommandType)['slash'] ? ChatInputCommandInteraction : ContextMenuCommandInteraction,
  client: CustomClient
) => Promise<boolean>;

export interface CommandOptions<T extends (typeof CommandType)[keyof typeof CommandType]> {
  builder: T extends (typeof CommandType)['slash'] ? SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> : ContextMenuCommandBuilder;
  config: CommandConfig;
  execute: CommandExecute<T>;
}

export class Command {
  name: string;
  description: string;
  id: string;
  helpText?: string;
  cooldown: number;
  group: (typeof CommandGroup)[keyof typeof CommandGroup];
  builder: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | ContextMenuCommandBuilder;
  type: (typeof CommandType)[keyof typeof CommandType];
  guildOnly: boolean;
  execute: CommandExecute<(typeof CommandType)['slash']> | CommandExecute<(typeof CommandType)['context']>;

  constructor(options: CommandOptions<(typeof CommandType)['slash']>);
  constructor(options: CommandOptions<(typeof CommandType)['context']>);
  constructor(options: CommandOptions<(typeof CommandType)['slash']> | CommandOptions<(typeof CommandType)['context']>) {
    this.builder = options.builder;

    this.name = options.config.name;
    this.builder.setName(options.config.name);

    this.description = options.config.description;
    if (this.builder instanceof SlashCommandBuilder) {
      this.builder = this.builder.setDescription(options.config.description);
      this.type = CommandType.slash;
    } else this.type = CommandType.context;

    if (options.config.guildOnly) {
      this.builder = this.builder.setDMPermission(false);
    } else this.builder = this.builder.setDMPermission(true);

    this.id = '0';
    this.guildOnly = options.config.guildOnly;
    this.helpText = options.config.helpText;
    this.cooldown = options.config.cooldown;
    this.group = options.config.group;
    this.execute = options.execute;
  }

  async run(interaction: ChatInputCommandInteraction): Promise<any>;
  async run(interaction: ContextMenuCommandInteraction): Promise<any>;
  async run(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction): Promise<any> {
    const client = interaction.client as CustomClient;
    const commandCooldownTimestamps = client.cooldowns.get(this.name)!;

    const now = Date.now();

    if (commandCooldownTimestamps.has(interaction.user.id)) {
      const userCooldown = commandCooldownTimestamps.get(interaction.user.id)!;
      const expirationTime = userCooldown.time + (userCooldown.type === CooldownStatus.apply ? this.cooldown : client.options.commandErrorCooldown) * 1000;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;

        return await interaction.reply({
          embeds: [
            emb(
              'error',
              userCooldown.type === CooldownStatus.errored
                ? `Sorry, the ${this} command previously errored out. Please try again in \`${formatTime(timeLeft)}\`.\n\nIf it happens again, contact support [here](${supportServer}).`
                : `Please wait \`${formatTime(timeLeft)}\` before reusing the ${this} command.`
            )
          ],
          ephemeral: true
        });
      }
    }

    let applyCooldown: (typeof CooldownStatus)[keyof typeof CooldownStatus] = CooldownStatus.errored;

    try {
      //@ts-ignore
      const output = await this.execute(interaction, client);

      applyCooldown = output ? CooldownStatus.apply : CooldownStatus.dontApply;
    } catch (error) {
      console.error(error);
      const reply = { content: 'There was an error while executing this command!', ephemeral: true };
      if (interaction.replied || interaction.deferred) return interaction.editReply(reply).catch(console.error);
      interaction.reply(reply).catch(console.error);
    } finally {
      if (applyCooldown !== CooldownStatus.dontApply && this.group !== CommandGroup.dev) {
        // dont apply cooldown to dev commands
        commandCooldownTimestamps.set(interaction.user.id, { time: Date.now(), type: applyCooldown });
        setTimeout(() => commandCooldownTimestamps.delete(interaction.user.id), (applyCooldown === CooldownStatus.apply ? this.cooldown : client.options.commandErrorCooldown) * 1000);
      }
    }
  }

  toString() {
    return this.type === CommandType.slash ? `</${this.name}:${this.id}>` : `\`* ${this.name}\``;
  }
}
