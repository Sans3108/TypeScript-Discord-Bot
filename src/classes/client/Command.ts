import { CustomClient } from '@classes/client/CustomClient.js';
import { developerIds, supportServer } from '@common/constants.js';
import { c, handleErr, log } from '@log';
import { emb } from '@utils';
import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  TimestampStyles,
  UserContextMenuCommandInteraction,
  time
} from 'discord.js';

export enum CommandGroup {
  general
}

export enum CommandType {
  chatInput,
  messageContext,
  userContext
}

export interface CommandOptionsMetadata {
  name: string;
  description?: string;
  helpText?: string;
  cooldown?: number;
  group?: CommandGroup;
  guildOnly?: boolean;
  developer?: boolean;
}

export enum CooldownType {
  normal,
  skipped,
  errored
}

export interface Cooldown {
  timestamp: number;
  type: CooldownType;
}

export enum CommandRunResult {
  normal,
  errored,
  onCooldown
}

//#region Base Command
export interface BaseCommandOptions {
  metadata: CommandOptionsMetadata;
}

export abstract class BaseCommand {
  public readonly name: string;
  public readonly description: string;
  public readonly helpText?: string;
  public readonly cooldown: number;
  public readonly group: CommandGroup;
  public readonly guildOnly: boolean;
  public readonly developer: boolean;
  public id: string;

  constructor(options: BaseCommandOptions) {
    this.name = options.metadata.name;
    this.description = options.metadata.description || 'No description.';
    this.helpText = options.metadata.helpText;
    this.cooldown = options.metadata.cooldown || 3; // 3s default cooldown
    this.group = options.metadata.group || CommandGroup.general;
    this.guildOnly = options.metadata.guildOnly || true;
    this.developer = options.metadata.developer || false;

    this.id = '0';
  }

  protected async handleCooldown<T extends ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction>(
    interaction: T,
    execute: (interaction: T, client: CustomClient) => Promise<boolean>
  ): Promise<CommandRunResult> {
    const client = interaction.client as CustomClient;

    const cooldownMap = client.commandCooldownMaps.get(this.name);

    if (!cooldownMap) throw new Error(`Could not find cooldown map for ${this.name}`);

    const now = Date.now();

    if (cooldownMap.has(interaction.user.id)) {
      const cooldown = cooldownMap.get(interaction.user.id)!;
      const expireTimestamp = cooldown.timestamp + (cooldown.type === CooldownType.normal ? this.cooldown : client.options.commandErrorCooldown) * 1000;

      if (now < expireTimestamp) {
        const timeLeft = time(new Date(expireTimestamp), TimestampStyles.RelativeTime);
        const cooldownNormalMessage = `You will be able to use the ${this} command ${timeLeft}.`;
        const cooldownErrorMessage = `Sorry, the ${this} command previously errored out. Please try again ${timeLeft}.\nIf this keeps happening, please contact support [here](${supportServer}).`;
        const message = cooldown.type === CooldownType.errored ? cooldownErrorMessage : cooldownNormalMessage;

        await interaction.reply({
          embeds: [emb('error', message)],
          ephemeral: true
        });

        return CommandRunResult.onCooldown;
      }
    }

    let commandResultCooldownType: CooldownType = CooldownType.errored;

    try {
      const output = await execute(interaction, client);

      commandResultCooldownType = output ? CooldownType.normal : CooldownType.skipped;
    } catch (_err: unknown) {
      const err = _err as Error;

      handleErr(err);

      const reply = { content: 'There was an error while executing this command!', ephemeral: true };

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(reply).catch(handleErr);
      } else await interaction.reply(reply).catch(handleErr);

      return CommandRunResult.errored;
    } finally {
      // dont apply cooldown to dev commands or commands that returned `false`
      if (commandResultCooldownType !== CooldownType.skipped && !this.developer) {
        cooldownMap.set(interaction.user.id, { timestamp: Date.now(), type: CooldownType.normal });
        setTimeout(() => cooldownMap.delete(interaction.user.id), (commandResultCooldownType === CooldownType.normal ? this.cooldown : client.options.commandErrorCooldown) * 1000);
      }

      return CommandRunResult.normal;
    }
  }

  toString() {
    return this.name;
  }
}
//#endregion

//#region ChatInput Command
export type SlashCommandBuilderTypes = SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;

export interface ChatInputCommandOptions extends BaseCommandOptions {
  builder: SlashCommandBuilderTypes;
  execute: (interaction: ChatInputCommandInteraction, client: CustomClient) => Promise<boolean>;
}

export class ChatInputCommand extends BaseCommand {
  public readonly builder: SlashCommandBuilderTypes;
  protected readonly execute: (interaction: ChatInputCommandInteraction, client: CustomClient) => Promise<boolean>;

  public readonly type: CommandType = CommandType.chatInput;

  constructor(options: ChatInputCommandOptions) {
    super(options);
    this.builder = options.builder;
    this.execute = options.execute;

    this.builder.setName(this.name);
    this.builder.setDescription(this.description);
    this.builder.setDMPermission(!this.guildOnly);
  }

  public async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (this.developer && !developerIds.includes(interaction.user.id)) {
      log('commands', `${c(interaction.user.username, '#3ff293')} (${c(interaction.user.id, '#3ff2b6')}) tried to use developer command ${this.name} but is not a developer.`);

      await interaction.reply({ embeds: [emb('error', `You are not allowed to use the ${this} command. This incident was logged.`)], ephemeral: true });
      return;
    }

    const result = await this.handleCooldown(interaction, this.execute);

    const client = interaction.client as CustomClient;

    if (client.options.logCommandUses) {
      const res = Object.keys(CommandRunResult).find(key => CommandRunResult[key as keyof typeof CommandRunResult] === result)!;
      const type = Object.keys(CommandType).find(key => CommandType[key as keyof typeof CommandType] === this.type)!;

      log(
        'commands',
        `${c(interaction.user.username, '#3ff293')} (${c(interaction.user.id, '#3ff2b6')}) used ${c(`${this.type === CommandType.chatInput ? '/' : '*'}`, '#4538f5')} ${c(
          this.name,
          '#38c3f5'
        )} with result: ${res}`
      );
    }
  }

  toString() {
    return `</${this.name}:${this.id}>`;
  }
}
//#endregion

//#region MessageContext Command
export interface MessageContextCommandOptions extends BaseCommandOptions {
  builder: ContextMenuCommandBuilder;
  execute: (interaction: MessageContextMenuCommandInteraction, client: CustomClient) => Promise<boolean>;
}

export class MessageContextCommand extends BaseCommand {
  public readonly builder: ContextMenuCommandBuilder;
  protected readonly execute: (interaction: MessageContextMenuCommandInteraction, client: CustomClient) => Promise<boolean>;

  public readonly type: CommandType = CommandType.messageContext;

  constructor(options: MessageContextCommandOptions) {
    super(options);
    this.builder = options.builder;
    this.execute = options.execute;

    this.builder.setName(this.name);
    this.builder.setDMPermission(!this.guildOnly);
    this.builder.setType(ApplicationCommandType.Message);
  }

  public async run(interaction: MessageContextMenuCommandInteraction): Promise<void> {
    if (this.developer && !developerIds.includes(interaction.user.id)) {
      log('commands', `${c(interaction.user.username, '#3ff293')} (${c(interaction.user.id, '#3ff2b6')}) tried to use developer command ${this.name} but is not a developer.`);

      await interaction.reply({ embeds: [emb('error', `You are not allowed to use the ${this} command. This incident was logged.`)], ephemeral: true });
      return;
    }

    const result = await this.handleCooldown(interaction, this.execute);

    const client = interaction.client as CustomClient;

    if (client.options.logCommandUses) {
      const res = Object.keys(CommandRunResult).find(key => CommandRunResult[key as keyof typeof CommandRunResult] === result)!;
      const type = Object.keys(CommandType).find(key => CommandType[key as keyof typeof CommandType] === this.type)!;

      log(
        'commands',
        `${c(interaction.user.username, '#3ff293')} (${c(interaction.user.id, '#3ff2b6')}) used ${c(`${this.type === CommandType.chatInput ? '/' : '*'}`, '#4538f5')} ${c(
          this.name,
          '#38c3f5'
        )} with result: ${res}`
      );
    }
  }

  toString() {
    return `\`* ${this.name}\``;
  }
}
//#endregion

//#region UserContext Command
export interface UserContextCommandOptions extends BaseCommandOptions {
  builder: ContextMenuCommandBuilder;
  execute: (interaction: UserContextMenuCommandInteraction, client: CustomClient) => Promise<boolean>;
}

export class UserContextCommand extends BaseCommand {
  public readonly builder: ContextMenuCommandBuilder;
  protected readonly execute: (interaction: UserContextMenuCommandInteraction, client: CustomClient) => Promise<boolean>;

  public readonly type: CommandType = CommandType.messageContext;

  constructor(options: UserContextCommandOptions) {
    super(options);
    this.builder = options.builder;
    this.execute = options.execute;

    this.builder.setName(this.name);
    this.builder.setDMPermission(!this.guildOnly);
    this.builder.setType(ApplicationCommandType.User);
  }

  public async run(interaction: UserContextMenuCommandInteraction): Promise<void> {
    if (this.developer && !developerIds.includes(interaction.user.id)) {
      log('commands', `${c(interaction.user.username, '#3ff293')} (${c(interaction.user.id, '#3ff2b6')}) tried to use developer command ${this.name} but is not a developer.`);

      await interaction.reply({ embeds: [emb('error', `You are not allowed to use the ${this} command. This incident was logged.`)], ephemeral: true });
      return;
    }

    const result = await this.handleCooldown(interaction, this.execute);

    const client = interaction.client as CustomClient;

    if (client.options.logCommandUses) {
      const res = Object.keys(CommandRunResult).find(key => CommandRunResult[key as keyof typeof CommandRunResult] === result)!;
      const type = Object.keys(CommandType).find(key => CommandType[key as keyof typeof CommandType] === this.type)!;

      log(
        'commands',
        `${c(interaction.user.username, '#3ff293')} (${c(interaction.user.id, '#3ff2b6')}) used ${c(`${this.type === CommandType.chatInput ? '/' : '*'}`, '#4538f5')} ${c(
          this.name,
          '#38c3f5'
        )} with result: ${res}`
      );
    }
  }

  toString() {
    return `\`* ${this.name}\``;
  }
}
//#endregion

export abstract class Command {
  public static ChatInput = ChatInputCommand;
  public static MessageContext = MessageContextCommand;
  public static UserContext = UserContextCommand;
}
