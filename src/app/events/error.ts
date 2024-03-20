import { DiscordEvent } from '@classes/events/DiscordEvent.js';
import { handleErr } from '@log';

export default new DiscordEvent('error', async err => {
  handleErr(err);
});
