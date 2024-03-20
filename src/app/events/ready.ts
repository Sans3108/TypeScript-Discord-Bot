import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { c, log } from '@log';

export default new DiscordEvent('ready', async client => {
  log('client', `Logged in as ${c(client.user.displayName, '#f5cf38')} (${c(client.user.id, '#f5cf38')})`);
});
