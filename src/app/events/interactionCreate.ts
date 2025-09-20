import { ChatInputCommand } from '@classes/client/Command.js';
import { CustomClient } from '@classes/client/CustomClient.js';
import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { t } from '@i18n';
import { handleErr } from '@log';
import { MessageFlags } from 'discord.js';

export default new DiscordEvent('interactionCreate', async interaction => {
  const client = interaction.client as CustomClient;

  const isCommand =
    interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand() || interaction.isAutocomplete();

  if (!isCommand) return;

  const command = client.commands.get(interaction.commandName)!;

  if (interaction.isAutocomplete()) {
    if (command instanceof ChatInputCommand && command.handleAutocomplete) {
      await command.handleAutocomplete(interaction, client);
      return;
    }
    return;
  }

  try {
    //@ts-expect-error
    await command.run(interaction);
  } catch (_err: unknown) {
    const err = _err as Error;

    handleErr(err);

    const reply = { content: t('command.error', { lng: interaction.locale }) };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(reply).catch(handleErr);
      return;
    }

    await interaction.reply({ ...reply, flags: [MessageFlags.Ephemeral] }).catch(handleErr);
  }
});
