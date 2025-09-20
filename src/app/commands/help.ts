import { Command, CommandGroup, getCommandGroupName } from '@classes/client/Command.js';
import { colors, supportServer } from '@common/constants.js';
import { t } from '@i18n';
import { capitalize, formatTime, getLocalizationMap } from '@utils';
import { APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

export default new Command.ChatInput({
  builder: new SlashCommandBuilder().addStringOption(option => {
    option
      .setName('command')
      .setNameLocalizations(getLocalizationMap('commands.help.option1.name'))
      .setDescription('The command you need help with.')
      .setDescriptionLocalizations(getLocalizationMap('commands.help.option1.description'))
      .setAutocomplete(true);

    return option;
  }),
  metadata: {
    name: 'help',
    nameLocalizations: getLocalizationMap('commands.help.name'),
    description: 'Get a list of commands or help with a specific command.',
    descriptionLocalizations: getLocalizationMap('commands.help.description'),
    cooldownSeconds: 5,
    group: CommandGroup.general,
    guildInstalled: true,
    userInstalled: true,
    contexts: true
  },
  execute: async function (interaction, client) {
    // TODO: Add more info (such as usage) to commands

    const commandOption = interaction.options.getString('command');

    if (commandOption) {
      const command = client.commands.get(commandOption);

      if (!command) {
        const unknownCommand = new EmbedBuilder()
          .setColor(colors.embedColors.info)
          .setTitle(t('commands.help.strings.unknownCommandTitle', { lng: interaction.locale }))
          .setDescription(t('commands.help.strings.unknownCommandDescription', { lng: interaction.locale, commandName: commandOption }))
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: client.user.displayName, iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.reply({ embeds: [unknownCommand], flags: [MessageFlags.Ephemeral] });

        return false;
      }

      const fields: APIEmbedField[] = [
        {
          name: `**${t('commands.help.strings.group', { lng: interaction.locale })}**`,
          value: `\`${capitalize(getCommandGroupName(command.group, interaction.locale))}\``,
          inline: true
        },
        { name: `**${t('commands.help.strings.cooldown', { lng: interaction.locale })}**`, value: `\`${formatTime(command.cooldown)}\``, inline: true }
      ];

      const helpText = command.getLocalized('helpText', interaction.locale);

      const commandHelp = new EmbedBuilder()
        .setColor(colors.embedColors.info)
        .setTitle(`${command}`)
        .setDescription(command.getLocalized('description', interaction.locale) + (helpText ? `\n\n${helpText}` : ''))
        .addFields(...fields)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: client.user.displayName, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      await interaction.reply({ embeds: [commandHelp], flags: [MessageFlags.Ephemeral] });
      return true;
    }

    const commandGroups: APIEmbedField[] = Object.keys(CommandGroup)
      .filter(value => client.commands.filter(c => c.group === CommandGroup[value as keyof typeof CommandGroup]).size > 0)
      .map(value => {
        const g = CommandGroup[value as keyof typeof CommandGroup];
        const localizedGroupName = capitalize(getCommandGroupName(g, interaction.locale));

        return {
          name: `**${t('commands.help.strings.groupCommands', { lng: interaction.locale, groupName: localizedGroupName })}**`,
          value: client.commands
            .filter(c => c.group === g)
            .map(c => `${c.getLocalized('name', interaction.locale)} - ${c.getLocalized('description', interaction.locale)}`)
            .join('\n')
        };
      });

    commandGroups.push({
      name: '\u200b',
      value: `_${t('commands.help.strings.tip', { lng: interaction.locale })}_`
    });

    const commandsEmbed = new EmbedBuilder()
      .setColor(colors.embedColors.info)
      .setTitle(`${client.user.displayName} - ${t('commands.help.name', { lng: interaction.locale })}`)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(t('commands.help.strings.botDescription', { lng: interaction.locale, author: `\`sans._.\` <@366536353418182657>` }))
      .addFields(...commandGroups)
      .setTimestamp();

    const supportServerLinkButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(supportServer)
      .setLabel(t('commands.help.strings.supportServer', { lng: interaction.locale }))
      .setEmoji('🔗');
    const botInviteLinkButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}`)
      .setLabel(t('commands.help.strings.addBot', { lng: interaction.locale, botName: client.user.displayName }))
      .setEmoji('🔗');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(supportServerLinkButton, botInviteLinkButton);

    await interaction.reply({ embeds: [commandsEmbed], components: [row], flags: [MessageFlags.Ephemeral] });

    return true;
  },
  handleAutocomplete: async function (interaction, client) {
    const focusedOption = interaction.options.getFocused(true);

    const lng = interaction.locale;

    if (focusedOption.name === 'command') {
      const choices: { name: string; value: string }[] = client.commands.map(c => {
        if (c.nameLocalizations && c.nameLocalizations[lng]) return { name: c.nameLocalizations[lng], value: c.name };
        return { name: c.name, value: c.name };
      });

      const filtered = choices.filter(choice => choice.value.startsWith(focusedOption.value));
      await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.value })).slice(0, 25));
    }
  }
});
