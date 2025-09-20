import { CustomClient } from '@classes/client/CustomClient.js';
import { colors, developerIds, supportServer } from '@common/constants.js';
import { t } from '@i18n';
import { c, handleErr, log } from '@log';
import { emb, loggedCommand } from '@utils';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  InteractionContextType,
  Locale,
  LocalizationMap,
  MessageContextMenuCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  TimestampStyles,
  UserContextMenuCommandInteraction,
  time
} from 'discord.js';

export enum CommandGroup {
  general
}

export function getCommandGroupName(group: CommandGroup, lng: Locale): string {
  if (group === CommandGroup.general) return t('command.groups.general', { lng });

  throw new Error(`Unknown command group: ${group}`);
}

export enum CommandType {
  chatInput,
  messageContext,
  userContext
}

export type AllowedCommandSources = keyof typeof InteractionContextType;

export interface CommandOptionsMetadata {
  name: string;
  nameLocalizations?: LocalizationMap;
  description: string;
  descriptionLocalizations?: LocalizationMap;
  helpText?: string;
  helpTextLocalizations?: LocalizationMap;
  cooldownSeconds?: number;
  group?: CommandGroup;
  developer?: boolean;
  userInstalled: boolean;
  guildInstalled: boolean;
  contexts: true | NonEmptyArray<AllowedCommandSources>;
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
export type SlashCommandBuilderTypes =
  | SlashCommandBuilder
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder;

export interface BaseCommandOptions {
  metadata: CommandOptionsMetadata;
}

export abstract class BaseCommand {
  private _patched: boolean;
  public readonly name: string;
  public readonly nameLocalizations?: LocalizationMap;
  public readonly description: string;
  public readonly descriptionLocalizations?: LocalizationMap;
  public readonly helpText?: string;
  public readonly helpTextLocalizations?: LocalizationMap;
  public readonly cooldown: number;
  public readonly group: CommandGroup;
  public readonly developer: boolean;
  public readonly userInstalled: boolean;
  public readonly guildInstalled: boolean;
  public readonly contexts: CommandOptionsMetadata['contexts'];
  public id: string;

  constructor(options: BaseCommandOptions) {
    this._patched = false;

    this.userInstalled = options.metadata.userInstalled;
    this.guildInstalled = options.metadata.guildInstalled;
    this.name = options.metadata.name;
    this.nameLocalizations = options.metadata.nameLocalizations;
    this.description = options.metadata.description;
    this.descriptionLocalizations = options.metadata.descriptionLocalizations;
    this.helpText = options.metadata.helpText;
    this.helpTextLocalizations = options.metadata.helpTextLocalizations;
    this.cooldown = options.metadata.cooldownSeconds ?? 3; // 3s default cooldown
    this.group = options.metadata.group ?? CommandGroup.general;
    this.developer = options.metadata.developer ?? false;
    this.contexts = options.metadata.contexts;

    this.id = '0';
  }

  protected patch(self: ChatInputCommand | UserContextCommand | MessageContextCommand): this {
    if (this._patched) return this;

    if (!self.userInstalled && !self.guildInstalled) {
      throw new Error(`${loggedCommand(self)} must be available in at least one installation context.`);
    }

    const integrationTypes: ApplicationIntegrationType[] = [];

    if (this.userInstalled) integrationTypes.push(ApplicationIntegrationType.UserInstall);
    if (this.guildInstalled) integrationTypes.push(ApplicationIntegrationType.GuildInstall);

    self.builder.setIntegrationTypes(integrationTypes);

    if (this.contexts === true) {
      self.builder.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel);
    } else {
      const contexts: InteractionContextType[] = this.contexts.map(c => InteractionContextType[c]);
      self.builder.setContexts(contexts);
    }

    this._patched = true;
    return this;
  }

  public get patched(): boolean {
    return this._patched;
  }

  protected async handleCooldown<T extends ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction | ButtonInteraction>(
    interaction: T,
    execute: (interaction: T, client: CustomClient) => Promise<boolean>
  ): Promise<CommandRunResult> {
    const lng = interaction.locale;
    const client = interaction.client as CustomClient;

    const cooldownMap = client.commandCooldownMaps.get(this.name);

    if (!cooldownMap) throw new Error(`Could not find cooldown map for ${c(this.name, colors.command.name)}.`);

    const now = Date.now();

    if (cooldownMap.has(interaction.user.id)) {
      const cooldown = cooldownMap.get(interaction.user.id)!;
      const expireTimestamp = cooldown.timestamp + (cooldown.type === CooldownType.normal ? this.cooldown : client.options.commandErrorCooldownSeconds) * 1000;

      if (now < expireTimestamp) {
        const timeLeft = time(new Date(expireTimestamp), TimestampStyles.RelativeTime);

        const commandName = this.toString();

        const cooldownNormalMessage = t('command.cooldown.normal', { lng, commandName, discordRelativeStamp: timeLeft });
        const cooldownErrorMessage = t('command.cooldown.error', { lng, commandName, discordRelativeStamp: timeLeft, supportServer });
        const message = cooldown.type === CooldownType.errored ? cooldownErrorMessage : cooldownNormalMessage;

        await interaction.reply({
          embeds: [emb('error', message)],
          flags: [MessageFlags.Ephemeral]
        });

        return CommandRunResult.onCooldown;
      }
    }

    let commandResultCooldownType: CooldownType = CooldownType.errored;

    let errored = false;

    try {
      const output = await execute(interaction, client);

      commandResultCooldownType = output ? CooldownType.normal : CooldownType.skipped;
    } catch (_err: unknown) {
      errored = true;
      const err = _err as Error;

      handleErr(err);

      const reply = { content: t('command.error', { lng }) };

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(reply).catch(handleErr);
      } else await interaction.reply(reply).catch(handleErr);
    } finally {
      // dont apply cooldown to dev commands or commands that returned `false`
      if (commandResultCooldownType !== CooldownType.skipped && !this.developer) {
        cooldownMap.set(interaction.user.id, { timestamp: Date.now(), type: errored ? CooldownType.errored : CooldownType.normal });
        setTimeout(() => cooldownMap.delete(interaction.user.id), (errored ? client.options.commandErrorCooldownSeconds : this.cooldown) * 1000);
      }

      return errored ? CommandRunResult.errored : CommandRunResult.normal;
    }
  }

  public getLocalized(prop: 'name' | 'description', lng: Locale): string;
  public getLocalized(prop: 'helpText', lng: Locale): string | undefined;
  public getLocalized(prop: 'name' | 'description' | 'helpText', lng: Locale): string | undefined {
    if (prop === 'name') return this.nameLocalizations?.[lng] ?? this.name;
    if (prop === 'description') return this.descriptionLocalizations?.[lng] ?? this.description;
    if (prop === 'helpText') return this.helpTextLocalizations?.[lng] ?? this.helpText;

    throw new Error(`Unknown property: ${prop}`);
  }

  toString() {
    return this.name;
  }
}
//#endregion

//#region ChatInput Command
export interface ChatInputCommandOptions extends BaseCommandOptions {
  builder: SlashCommandBuilderTypes;
  execute: (interaction: ChatInputCommandInteraction, client: CustomClient) => Promise<boolean>;
  handleAutocomplete?: (interaction: AutocompleteInteraction, client: CustomClient) => Promise<unknown>;
}

export class ChatInputCommand extends BaseCommand {
  public readonly builder: SlashCommandBuilderTypes;
  protected readonly execute: (interaction: ChatInputCommandInteraction, client: CustomClient) => Promise<boolean>;

  public readonly type: CommandType = CommandType.chatInput;

  public readonly handleAutocomplete?: (interaction: AutocompleteInteraction, client: CustomClient) => Promise<unknown>;

  constructor(options: ChatInputCommandOptions) {
    super(options);
    this.builder = options.builder;
    this.execute = options.execute;

    this.builder.setName(this.name);
    this.builder.setNameLocalizations(this.nameLocalizations ?? {});
    this.builder.setDescription(this.description);
    this.builder.setDescriptionLocalizations(this.descriptionLocalizations ?? {});

    if (options.handleAutocomplete) {
      this.handleAutocomplete = options.handleAutocomplete;
    }

    this.patch(this);
  }

  public async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (this.developer && !developerIds.includes(interaction.user.id)) {
      log(
        'commands',
        `${c(interaction.user.username, colors.user.name)} (${c(interaction.user.id, colors.user.id)}) tried to use developer command ${loggedCommand(this)} but is not a developer.`
      );

      await interaction.reply({
        embeds: [emb('error', t('command.devOnlyWarning', { lng: interaction.locale, commandName: this.toString() }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const result = await this.handleCooldown(interaction, this.execute);

    const client = interaction.client as CustomClient;

    if (client.options.logCommandUses) {
      const res = Object.keys(CommandRunResult).find(key => CommandRunResult[key as keyof typeof CommandRunResult] === result)!;

      log('commands', `${c(interaction.user.username, colors.user.name)} (${c(interaction.user.id, colors.user.id)}) used ${loggedCommand(this)} with result: ${res}`);
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
    this.builder.setNameLocalizations(this.nameLocalizations ?? {});
    this.builder.setType(ApplicationCommandType.Message);

    this.patch(this);
  }

  public async run(interaction: MessageContextMenuCommandInteraction): Promise<void> {
    if (this.developer && !developerIds.includes(interaction.user.id)) {
      log(
        'commands',
        `${c(interaction.user.username, colors.user.name)} (${c(interaction.user.id, colors.user.id)}) tried to use developer command ${loggedCommand(this)} but is not a developer.`
      );

      await interaction.reply({
        embeds: [emb('error', t('command.devOnlyWarning', { lng: interaction.locale, commandName: this.toString() }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const result = await this.handleCooldown(interaction, this.execute);

    const client = interaction.client as CustomClient;

    if (client.options.logCommandUses) {
      const res = Object.keys(CommandRunResult).find(key => CommandRunResult[key as keyof typeof CommandRunResult] === result)!;

      log('commands', `${c(interaction.user.username, colors.user.name)} (${c(interaction.user.id, colors.user.id)}) used ${loggedCommand(this)} with result: ${res}`);
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
    this.builder.setNameLocalizations(this.nameLocalizations ?? {});
    this.builder.setType(ApplicationCommandType.User);

    this.patch(this);
  }

  public async run(interaction: UserContextMenuCommandInteraction): Promise<void> {
    if (this.developer && !developerIds.includes(interaction.user.id)) {
      log(
        'commands',
        `${c(interaction.user.username, colors.user.name)} (${c(interaction.user.id, colors.user.id)}) tried to use developer command ${loggedCommand(this)} ${c(this.name, colors.command.name)} but is not a developer.`
      );

      await interaction.reply({
        embeds: [emb('error', t('command.devOnlyWarning', { lng: interaction.locale, commandName: this.toString() }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const result = await this.handleCooldown(interaction, this.execute);

    const client = interaction.client as CustomClient;

    if (client.options.logCommandUses) {
      const res = Object.keys(CommandRunResult).find(key => CommandRunResult[key as keyof typeof CommandRunResult] === result)!;

      log('commands', `${c(interaction.user.username, colors.user.name)} (${c(interaction.user.id, colors.user.id)}) used ${loggedCommand(this)} with result: ${res}`);
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
