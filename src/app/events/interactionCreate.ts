import { CustomClient } from '@classes/client/CustomClient.js';
import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { handleErr } from '@log';

export default new DiscordEvent('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) {
    if (!interaction.isMessageContextMenuCommand()) return;
  }

  const client = interaction.client as CustomClient;

  const command = client.commands.get(interaction.commandName)!;

  try {
    //@ts-ignore
    await command.run(interaction);
  } catch (_err: any) {
    const err: Error = _err;

    handleErr(err);

    const reply = { content: 'There was an error while executing this command!', ephemeral: true };

    if (interaction.replied || interaction.deferred) return await interaction.editReply(reply).catch(handleErr);

    return interaction.reply(reply).catch(handleErr);
  }
});
