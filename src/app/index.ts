//#region Logger
console.log('Loading logger...');
import { c, handleErr, log, wrapLog } from '@log';
log('setup', 'Logger loaded!');
//#endregion

//#region Args
import { colors } from '@common/constants.js';
import { handleArgs } from '@scripts/handleArgs.js';

const argOptions = handleArgs(process.argv);
//#endregion

//#region Process errors
if (!argOptions.dryRun) {
  const shutdown = (err: any) => {
    handleErr(err);

    process.exit(1);
  };

  process.on('uncaughtException', shutdown);
  process.on('unhandledRejection', shutdown);
}
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

//#region i18n
log('setup', 'Setting up i18n...');

import i18n from '@i18n';

const langs = Object.keys(i18n.store.data);

log('setup', `i18n loaded ${c(langs.length.toString(), colors.number)} locales: ` + langs.map(lang => c(lang, colors.string)).join(', '));
//#endregion

//#region Discord client setup
log('setup', 'Setting up Discord client');

import { ChatInputCommand, MessageContextCommand, UserContextCommand } from '@classes/client/Command.js';
import { CustomClient } from '@classes/client/CustomClient.js';
import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { deployCommands } from '@scripts/deployCommands.js';
import { ClientEvents, GatewayIntentBits as Intents } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new CustomClient({
  intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent, Intents.GuildMembers], // Not sure about this
  commandErrorCooldownSeconds: 60,
  logCommandUses: true,

  // These should be the same as the installation contexts in the developer dashboard.
  allowGuildInstalledCommands: true,
  allowUserInstalledCommands: true
});

// Empty deploy
if (argOptions.emptyDeploy) {
  log('client', 'Removing all deployed commands...', 1);
  await deployCommands(client, dev, true);
  log('process', `Running without any commands is pointless, exiting...`, 1);
  process.exit(0);
}

// Commands
log('client', `Setting up commands`, 1);

const commandFiles = fs.readdirSync(path.join(__dirname, './commands')).filter(file => file.endsWith('.js'));

for (const commandFile of commandFiles) {
  const command: ChatInputCommand | MessageContextCommand | UserContextCommand = (await import(`./commands/${commandFile}`)).default;
  client.addCommand(command);

  log('client', `Imported ${loggedCommand(command)}`, 2);
}

// Sending commands to discord
if (argOptions.skipDeploy) {
  log('client', `Skipped refreshing API commands, no command IDs will be gathered!`, 1);
  wrapLog('warn', `If the previous run did not deploy any commands, you could be running without commands now. Unknown things might happen!`, 1);
  wrapLog('warn', `If that's not the case, you can ignore this message.`, 1);
} else {
  log('client', 'Refreshing API commands', 1);
  await deployCommands(client, dev);
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
log('client', argOptions.dryRun ? 'Logging in... (DRY RUN)' : 'Logging in...');

if (!argOptions.dryRun) {
  client.login(DISCORD_CLIENT_TOKEN);
}
//#endregion
