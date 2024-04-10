//#region Logger
console.log('Loading logger...');
import { c, handleErr, log } from '@log';
log('setup', 'Logger loaded!');
//#endregion

//#region Args
import { handleArgs } from '@scripts/handleArgs.js';
import { colors } from '@common/constants.js';

const argOptions = handleArgs(process.argv);
//#endregion

//#region Environment variables
log('setup', 'Loading environment variables...');

import { checkEnv, loggedCommand } from '@utils';
import 'dotenv/config';

try {
  // Any env variables specified here are confirmed to be defined if the function passes.
  // It is safe to globally define them as strings in global.d.ts on the process.env object.
  // To get them as the types set here you have to manually cast them.
  checkEnv([
    { key: 'DISCORD_CLIENT_TOKEN', type: 'string' },
    { key: 'DEV_DISCORD_GUILD_ID', type: 'string' },
    { key: 'DEV_MODE', type: 'boolean' }
  ]);
} catch (e) {
  const err = e as Error;

  handleErr(err);
  process.exit(1);
}

const { DISCORD_CLIENT_TOKEN, DEV_MODE } = process.env;

const dev = DEV_MODE === 'true';

log('setup', `Developer mode is ${c(dev ? 'ON' : 'OFF', colors.developerMode[dev ? 'on' : 'off'])}`);
//#endregion

//#region Imports
log('setup', 'Importing files and modules');

import { ClientEvents, GatewayIntentBits as Intents } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ChatInputCommand, MessageContextCommand, UserContextCommand } from '@classes/client/Command.js';
import { CustomClient } from '@classes/client/CustomClient.js';
import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { deployCommands } from '@scripts/deployCommands.js';
//#endregion

//#region Discord client setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log('setup', 'Setting up Discord client');

const client = new CustomClient({
  intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent, Intents.GuildMembers], // Not sure about this
  commandErrorCooldown: 60,
  logCommandUses: true
});

// Commands
log('client', `Setting up commands`, 1);

const commandFiles = fs.readdirSync(path.join(__dirname, './commands')).filter(file => file.endsWith('.js'));

for (const commandFile of commandFiles) {
  const command: ChatInputCommand | MessageContextCommand | UserContextCommand = (await import(`./commands/${commandFile}`)).default;
  client.addCommand(command);

  log('client', `Imported ${loggedCommand(command)}`, 2);
}

// Sending commands to discord
if (!argOptions.skipDeploy) {
  log('client', 'Refreshing API commands', 1);
  await deployCommands(client, dev);
} else {
  log('client', `Skipped refreshing API commands, no command IDs will be gathered!`, 1);
}

// Events
log('events', `Setting up Discord events`);
const discordEventFiles = fs.readdirSync(path.join(__dirname, './events')).filter(file => file.endsWith('.js'));

for (const eventFile of discordEventFiles) {
  const event: DiscordEvent<keyof ClientEvents> = (await import(`./events/${eventFile}`)).default;

  client.on(event.type, event.execute);

  log('events', `Imported & Loaded ${c(event.type, colors.event.name)}`, 1);
}
//#endregion

//#region Discord Login
log('client', 'Logging in...');
client.login(DISCORD_CLIENT_TOKEN);
//#endregion
