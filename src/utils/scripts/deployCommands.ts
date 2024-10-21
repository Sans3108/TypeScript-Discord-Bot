import { CustomClient } from '@classes/client/CustomClient.js';
import { colors } from '@common/constants.js';
import { c, handleErr, log } from '@log';
import { idFromToken, loggedCommand } from '@utils';
import { APIApplicationCommand, REST, Routes } from 'discord.js';

export async function deployCommands(client: CustomClient, dev: boolean, empty = false) {
  const { DEV_DISCORD_GUILD_ID, DISCORD_CLIENT_TOKEN } = process.env;

  const clientId = idFromToken(DISCORD_CLIENT_TOKEN);

  const rest = new REST({ version: '10' }).setToken(DISCORD_CLIENT_TOKEN);

  const commands =
    empty ?
      []
    : client.commands.map(command => {
        let data;

        try {
          data = command.builder.toJSON();
        } catch (e) {
          log('error', `${c(command.name, colors.command.name)} failed:`);
          handleErr(e as Error);
        }

        return data;
      });

  if (!empty) log('client', `Sending ${c(`${Array.from(commands.entries()).length}`, colors.number)} commands`, 2);

  if (!empty) log('client', `Retrieving command ID's`, 2);

  let data: APIApplicationCommand[];
  if (dev) {
    data = (await rest.put(Routes.applicationGuildCommands(clientId, DEV_DISCORD_GUILD_ID), {
      body: commands
    })) as APIApplicationCommand[];
  } else {
    data = (await rest.put(Routes.applicationCommands(clientId), {
      body: commands
    })) as APIApplicationCommand[];
  }

  if (!empty) {
    for (const command of client.commands.values()) {
      const apiCommand = data.find(c => c.name === command.name)!;
      command.id = apiCommand.id;
      log('client', `Gathered ID for ${loggedCommand(command)} (${c(command.id, colors.command.id)})`, 3);
    }
  }

  empty ? log('client', `Removed all API commands`, 1) : log('client', `Deployed API commands`, 1);
}
