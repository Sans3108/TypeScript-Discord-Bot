import { ChatInputCommand, CommandType, MessageContextCommand, UserContextCommand } from '@classes/client/Command';
import { colors } from '@common/constants';
import { c } from '@log';

export function loggedCommand(command: ChatInputCommand | UserContextCommand | MessageContextCommand) {
  const symbol =
    command.type === CommandType.chatInput ? '/'
    : command.type === CommandType.messageContext || command.type === CommandType.userContext ? '*'
    : '?';

  const coloredSymbol = c(symbol, colors.command.symbol);
  const name = c(command.name, colors.command.name);

  return `${coloredSymbol} ${name}`;
}
