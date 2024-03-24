import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { colors } from '@common/constants';
import { c, log } from '@log';

export default new DiscordEvent('ready', async client => {
  log('client', `Logged in as ${c(client.user.displayName, colors.user.name)} (${c(client.user.id, colors.user.id)})`);
});
