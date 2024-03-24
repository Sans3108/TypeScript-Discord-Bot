import { ClientEvents } from 'discord.js';

export class DiscordEvent<T extends keyof ClientEvents> {
  constructor(
    public type: T,
    public execute: (...args: ClientEvents[T]) => Promise<void>
  ) {}
}
