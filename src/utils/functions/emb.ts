import { colors } from '@common/constants.js';
import { ColorResolvable, EmbedBuilder } from 'discord.js';

export function emb(type: keyof typeof colors, description: string): EmbedBuilder;
export function emb(type: ColorResolvable, description: string): EmbedBuilder;
export function emb(type: ColorResolvable | keyof typeof colors, description: string): EmbedBuilder {
  let color: ColorResolvable;

  if (typeof type === 'string' && type in colors) {
    color = colors[type as keyof typeof colors];
  } else color = type as ColorResolvable;

  return new EmbedBuilder().setDescription(description).setColor(color);
}
