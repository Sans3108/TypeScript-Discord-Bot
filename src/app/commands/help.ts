import { Command, CommandGroup } from '@classes/client/Command.js';
import { colors, supportServer } from '@common/constants.js';
import { capitalize, formatTime } from '@utils';
import { APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

export default new Command.ChatInput({
  builder: new SlashCommandBuilder().addStringOption(option => {
    option.setName('command').setDescription('The command you need help with.').setAutocomplete(true);

    return option;
  }),
  metadata: {
    name: 'help',
    description: 'Get a list of commands or help with a specific command.',
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
          .setTitle(`Unknown command`)
          .setDescription(`Command \`${commandOption}\` doesn't exist!`)
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: client.user.displayName, iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.reply({ embeds: [unknownCommand], flags: [MessageFlags.Ephemeral] });

        return false;
      }

      const commandGroup = Object.keys(CommandGroup)
        .find(key => CommandGroup[key as keyof typeof CommandGroup] === command.group)!
        .toLowerCase();

      const fields: APIEmbedField[] = [
        { name: '**Group**', value: `\`${capitalize(commandGroup)}\``, inline: true },
        { name: '**Cooldown**', value: `\`${formatTime(command.cooldown)}\``, inline: true }
      ];

      const commandHelp = new EmbedBuilder()
        .setColor(colors.embedColors.info)
        .setTitle(`${command}`)
        .setDescription(command.description + (command.helpText ? `\n\n${command.helpText}` : ''))
        .addFields(...fields)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: client.user.displayName, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      await interaction.reply({ embeds: [commandHelp], flags: [MessageFlags.Ephemeral] });
      return true;
    }

    const commandGroups: APIEmbedField[] = Object.keys(CommandGroup)
      .filter(value => client.commands.filter(c => c.group === CommandGroup[value as keyof typeof CommandGroup]).size > 0)
      .map(value => ({
        name: `**${capitalize(value.toLowerCase())} commands:**`,
        value: client.commands
          .filter(c => c.group === CommandGroup[value as keyof typeof CommandGroup])
          .map(c => `${c} - ${c.description}`)
          .join('\n')
      }));

    commandGroups.push({
      name: '\u200b',
      value: `_Tip: Commands marked with \`*\` are context commands._`
    });

    const commandsEmbed = new EmbedBuilder()
      .setColor(colors.embedColors.info)
      .setTitle(`${client.user.displayName} - Help`)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`My awesome discord bot template.\n\nMade by \`Sans#0001\` <@366536353418182657>`)
      .addFields(...commandGroups)
      .setTimestamp();

    const supportServerLinkButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(supportServer).setLabel(`Support Server`).setEmoji('🔗');
    const botInviteLinkButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}`)
      .setLabel(`Add ${client.user.displayName}`)
      .setEmoji('🔗');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(supportServerLinkButton, botInviteLinkButton);

    await interaction.reply({ embeds: [commandsEmbed], components: [row], flags: [MessageFlags.Ephemeral] });

    return true;
  },
  handleAutocomplete: async function (interaction, client) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === 'command') {
      const choices: string[] = client.commands.map(c => c.name);

      const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
      await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
    }
  }
});
