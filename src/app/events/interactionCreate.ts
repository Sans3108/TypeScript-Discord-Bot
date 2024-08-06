import { ChatInputCommand } from '@classes/client/Command.js';
import { CustomClient } from '@classes/client/CustomClient.js';
import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { handleErr } from '@log';

export default new DiscordEvent('interactionCreate', async interaction => {
  const client = interaction.client as CustomClient;

  const isCommand = interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand() || interaction.isAutocomplete();

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

    const reply = { content: 'There was an error while executing this command!', ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(reply).catch(handleErr);
      return;
    }

    await interaction.reply(reply).catch(handleErr);
  }
});
