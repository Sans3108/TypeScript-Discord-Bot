import { idFromToken } from '@utils';
import { REST, Routes } from 'discord.js';

export async function resetCommands() {
  const { DEV_DISCORD_GUILD_ID, DISCORD_CLIENT_TOKEN } = process.env;

  const clientId = idFromToken(DISCORD_CLIENT_TOKEN);

  const rest = new REST({ version: '10' }).setToken(DISCORD_CLIENT_TOKEN);

  await rest.put(Routes.applicationCommands(clientId), { body: [] });
  await rest.put(Routes.applicationGuildCommands(clientId, DEV_DISCORD_GUILD_ID), { body: [] });
}
