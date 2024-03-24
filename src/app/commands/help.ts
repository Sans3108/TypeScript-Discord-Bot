import { ChatInputCommand, Command, CommandGroup, MessageContextCommand, UserContextCommand } from '@classes/client/Command.js';
import { botInvite, colors, supportServer } from '@common/constants.js';
import { capitalize, formatTime } from '@utils';
import { APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Hacky way of doing circulars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));

const commands: Collection<string, ChatInputCommand | MessageContextCommand | UserContextCommand> = new Collection();

for (const commandFile of commandFiles) {
  if (commandFile === path.basename(__filename)) continue;

  const command: ChatInputCommand | MessageContextCommand | UserContextCommand = (await import(`./${commandFile}`)).default;

  if (command.developer) continue;

  commands.set(command.name, command);
}

export default new Command.ChatInput({
  builder: new SlashCommandBuilder().addStringOption(option => {
    const options = commands.map(command => ({ name: command.name, value: command.name }));

    options.push({ name: 'help', value: 'help' });

    option
      .setName('command')
      .setDescription('The command you need help with.')
      .setChoices(...options);

    return option;
  }),
  metadata: {
    name: 'help',
    description: 'Get a list of commands or help with a specific command.',
    cooldown: 5,
    group: CommandGroup.general,
    guildOnly: false
  },
  execute: async function (interaction, client) {
    // TODO: Add more info (such as usage) to commands
    const helpCommand = client.commands.get('help') as ChatInputCommand;

    commands.set(helpCommand.name, helpCommand);

    const commandOption = interaction.options.getString('command');

    if (commandOption) {
      const command = commands.get(commandOption)!;

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
      await interaction.reply({ embeds: [commandHelp] });
      return true;
    }

    const commandGroups: APIEmbedField[] = Object.keys(CommandGroup)
      .filter(value => commands.filter(c => c.group === CommandGroup[value as keyof typeof CommandGroup]).size > 0)
      .map(value => ({
        name: `**${capitalize(value.toLowerCase())} commands:**`,
        value: commands
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
    const botInviteLinkButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(botInvite).setLabel(`Bot Invite`).setEmoji('🔗');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(supportServerLinkButton, botInviteLinkButton);

    await interaction.reply({ embeds: [commandsEmbed], components: [row] });

    return true;
  }
});
