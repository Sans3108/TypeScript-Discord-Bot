import { colors } from '@common/constants.js';
import { ColorResolvable, EmbedBuilder } from 'discord.js';

export function emb(type: keyof typeof colors.embedColors, description: string): EmbedBuilder;
export function emb(type: ColorResolvable, description: string): EmbedBuilder;
export function emb(type: ColorResolvable | keyof typeof colors.embedColors, description: string): EmbedBuilder {
  let color: ColorResolvable;

  if (typeof type === 'string' && type in colors.embedColors) {
    color = colors.embedColors[type as keyof typeof colors.embedColors];
  } else color = type as ColorResolvable;

  return new EmbedBuilder().setDescription(description).setColor(color);
}
